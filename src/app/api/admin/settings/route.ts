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
  const { data } = await service.from('store_settings').select('*');
  const settings: Record<string, unknown> = {};
  (data || []).forEach((s: any) => { settings[s.key] = s.value; });
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const service = createServiceClient();
  for (const [key, value] of Object.entries(body)) {
    await service.from('store_settings').upsert({ key, value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }
  return NextResponse.json({ success: true });
}
