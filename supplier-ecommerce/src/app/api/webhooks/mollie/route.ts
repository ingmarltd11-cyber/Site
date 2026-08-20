import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getMollieClient, mapMollieStatus } from '@/lib/mollie';
import { sendOrderEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Mollie sends application/x-www-form-urlencoded with id=
    const contentType = request.headers.get('content-type') || '';
    let paymentId: string | null = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      paymentId = formData.get('id') as string;
    } else {
      const body = await request.json().catch(() => ({}));
      paymentId = body.id;
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }

    // Always fetch payment status from Mollie (never trust the request body)
    const mollie = getMollieClient();
    const payment = await mollie.payments.get(paymentId);

    const supabase = createServiceClient();

    // Find our payment record
    const { data: paymentRecord, error: findError } = await supabase
      .from('payments')
      .select('*, orders(*)')
      .eq('mollie_payment_id', paymentId)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment not found:', paymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const newStatus = mapMollieStatus(payment.status);
    const order = paymentRecord.orders as { id: string; payment_status: string; order_status: string };

    // Update payment
    await supabase
      .from('payments')
      .update({
        status: newStatus,
        method: payment.method || null,
        mollie_data: payment as unknown as Record<string, unknown>,
        paid_at: payment.status === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    // Update order payment status
    const orderUpdate: Record<string, unknown> = {
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // When paid → move order to paid status and send emails
    if (payment.status === 'paid' && order.payment_status !== 'paid') {
      orderUpdate.order_status = 'paid';

      // Decrease stock
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      if (items) {
        for (const item of items) {
          if (item.product_id) {
            // Atomic stock decrease would be better with a DB function
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();
            if (product) {
              await supabase
                .from('products')
                .update({ stock: Math.max(0, product.stock - item.quantity) })
                .eq('id', item.product_id);
            }
          }
        }
      }

      await supabase.from('orders').update(orderUpdate).eq('id', order.id);

      // Send emails (idempotent)
      await sendOrderEmail(order.id, 'order_confirmation');
      await sendOrderEmail(order.id, 'payment_received');
    } else if (['failed', 'canceled', 'expired'].includes(payment.status)) {
      if (order.order_status === 'pending') {
        orderUpdate.order_status = 'cancelled';
      }
      await supabase.from('orders').update(orderUpdate).eq('id', order.id);

      if (payment.status === 'failed') {
        await sendOrderEmail(order.id, 'payment_failed');
      } else {
        await sendOrderEmail(order.id, 'order_cancelled');
      }
    } else {
      await supabase.from('orders').update(orderUpdate).eq('id', order.id);
    }

    // Mollie expects 200 OK
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Mollie webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
