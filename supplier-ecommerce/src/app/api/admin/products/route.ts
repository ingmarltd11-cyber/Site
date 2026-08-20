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

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().optional().nullable(),
  cost_price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
  min_order_quantity: z.number().int().positive().default(1),
  badge: z.string().optional().nullable(),
  supplier_name: z.string().optional().nullable(),
  supplier_sku: z.string().optional().nullable(),
  supplier_product_id: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  category_id: z.string().uuid().optional().nullable(),
  image_url: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = productSchema.parse(body);
    const service = createServiceClient();

    const { data: product, error } = await service
      .from('products')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        short_description: data.short_description || null,
        sku: data.sku || null,
        price: data.price,
        compare_at_price: data.compare_at_price || null,
        cost_price: data.cost_price || null,
        stock: data.stock,
        min_order_quantity: data.min_order_quantity,
        badge: data.badge || null,
        supplier_name: data.supplier_name || null,
        supplier_sku: data.supplier_sku || null,
        supplier_product_id: data.supplier_product_id || null,
        is_published: data.is_published,
        is_featured: data.is_featured,
        category_id: data.category_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.image_url) {
      await service.from('product_images').insert({
        product_id: product.id,
        url: data.image_url,
        is_primary: true,
        sort_order: 0,
      });
    }

    return NextResponse.json({ id: product.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
