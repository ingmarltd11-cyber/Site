import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const service = createServiceClient();
  const { data } = await service.from('shipping_methods').select('*').order('sort_order');
  return NextResponse.json({ methods: data || [] });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const service = createServiceClient();
  const { data, error } = await service.from('shipping_methods').insert({
    name: body.name, description: body.description || null,
    price: body.price, free_shipping_threshold: body.free_shipping_threshold || null,
    estimated_days_min: body.estimated_days_min || null,
    estimated_days_max: body.estimated_days_max || null,
    countries: body.countries || ['NL', 'BE', 'DE'],
    is_active: body.is_active ?? true,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ method: data });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const service = createServiceClient();
  const { id, ...rest } = body;
  const { data, error } = await service.from('shipping_methods').update(rest).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ method: data });
}
