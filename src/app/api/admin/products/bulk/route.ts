import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return null;
  return user;
}

const actionSchema = z.object({
  type: z.literal('action'),
  action: z.enum(['publish', 'unpublish', 'feature', 'unfeature', 'delete', 'adjust_price']),
  ids: z.array(z.string().uuid()).min(1),
  // for adjust_price: percentage change, e.g. -10 for -10%, 5 for +5%
  percent: z.number().optional(),
});

const importRowSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().optional(),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().optional().nullable(),
  cost_price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  min_order_quantity: z.number().int().positive().default(1),
  is_published: z.boolean().default(false),
});

const importSchema = z.object({
  type: z.literal('import'),
  rows: z.array(importRowSchema).min(1).max(2000),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const service = createServiceClient();

  if (body.type === 'import') {
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid import data', details: parsed.error.flatten() }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: { sku: string; message: string }[] = [];

    for (const row of parsed.data.rows) {
      const { data: existing } = await service
        .from('products')
        .select('id')
        .eq('sku', row.sku)
        .maybeSingle();

      if (existing) {
        const { error } = await service
          .from('products')
          .update({
            name: row.name,
            price: row.price,
            compare_at_price: row.compare_at_price ?? null,
            cost_price: row.cost_price ?? null,
            stock: row.stock,
            min_order_quantity: row.min_order_quantity,
            is_published: row.is_published,
          })
          .eq('id', existing.id);
        if (error) {
          failed++;
          errors.push({ sku: row.sku, message: error.message });
        } else {
          updated++;
        }
      } else {
        const { error } = await service.from('products').insert({
          name: row.name,
          slug: row.slug || slugify(row.name),
          sku: row.sku,
          price: row.price,
          compare_at_price: row.compare_at_price ?? null,
          cost_price: row.cost_price ?? null,
          stock: row.stock,
          min_order_quantity: row.min_order_quantity,
          is_published: row.is_published,
        });
        if (error) {
          failed++;
          errors.push({ sku: row.sku, message: error.message });
        } else {
          created++;
        }
      }
    }

    return NextResponse.json({ created, updated, failed, errors: errors.slice(0, 20) });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }
  const { action, ids, percent } = parsed.data;

  if (action === 'delete') {
    const { error } = await service.from('products').delete().in('id', ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ affected: ids.length });
  }

  if (action === 'adjust_price') {
    if (typeof percent !== 'number' || percent <= -100) {
      return NextResponse.json({ error: 'percent is required and must be > -100' }, { status: 400 });
    }
    const { data: products, error: fetchError } = await service
      .from('products')
      .select('id, price')
      .in('id', ids);
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    for (const p of products || []) {
      const newPrice = Math.max(0, Number((Number(p.price) * (1 + percent / 100)).toFixed(2)));
      await service.from('products').update({ price: newPrice }).eq('id', p.id);
    }
    return NextResponse.json({ affected: (products || []).length });
  }

  const update: Record<string, boolean> = {};
  if (action === 'publish') update.is_published = true;
  if (action === 'unpublish') update.is_published = false;
  if (action === 'feature') update.is_featured = true;
  if (action === 'unfeature') update.is_featured = false;

  const { error } = await service.from('products').update(update).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ affected: ids.length });
}
