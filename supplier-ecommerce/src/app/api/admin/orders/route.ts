import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendOrderEmail } from '@/lib/email';
import type { EmailType } from '@/types/database';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') return null;
  return user;
}

const STATUS_EMAIL_MAP: Record<string, EmailType> = {
  processing: 'order_processing',
  shipped: 'order_shipped',
  completed: 'order_completed',
  cancelled: 'order_cancelled',
  refunded: 'refund',
};

export async function PUT(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, order_status, tracking_number, admin_note } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const service = createServiceClient();

    // Get current order for status comparison
    const { data: current } = await service
      .from('orders')
      .select('order_status')
      .eq('id', id)
      .single();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (order_status) updates.order_status = order_status;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (admin_note !== undefined) updates.admin_note = admin_note;

    const { error } = await service.from('orders').update(updates).eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Send email if status changed and mapping exists
    if (
      order_status &&
      current &&
      order_status !== current.order_status &&
      STATUS_EMAIL_MAP[order_status]
    ) {
      await sendOrderEmail(id, STATUS_EMAIL_MAP[order_status]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
