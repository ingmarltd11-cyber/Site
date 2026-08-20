import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendOrderEmail } from '@/lib/email';
import type { EmailType } from '@/types/database';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return null;
  return user;
}

const statusEmailMap: Record<string, EmailType> = {
  processing: 'order_processing',
  shipped: 'order_shipped',
  completed: 'order_completed',
  cancelled: 'order_cancelled',
  refunded: 'refund',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const service = createServiceClient();
  const { data, error } = await service
    .from('orders')
    .select('*, order_items(*), payments(*)')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ order: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const service = createServiceClient();

  const { data: current } = await service.from('orders').select('order_status').eq('id', id).single();

  const update: Record<string, unknown> = {};
  if (body.order_status) update.order_status = body.order_status;
  if (body.tracking_number !== undefined) update.tracking_number = body.tracking_number;
  if (body.admin_note !== undefined) update.admin_note = body.admin_note;
  if (body.payment_status) update.payment_status = body.payment_status;

  const { data, error } = await service.from('orders').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Send email on status change
  if (body.order_status && body.order_status !== current?.order_status) {
    const emailType = statusEmailMap[body.order_status];
    if (emailType) {
      await sendOrderEmail(id, emailType);
    }
  }

  return NextResponse.json({ order: data });
}
