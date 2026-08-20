import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  let orderNumber: string | null = null;

  if (orderId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('orders')
      .select('order_number, payment_status')
      .eq('id', orderId)
      .single();
    orderNumber = data?.order_number || null;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
        Thank you for your order!
      </h1>
      <p className="mt-4 text-neutral-600">
        {orderNumber
          ? `Your order ${orderNumber} has been received. You will receive a confirmation email shortly.`
          : 'Your order has been received. You will receive a confirmation email shortly.'}
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Payment is being processed. You will be notified once it is confirmed.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/account/orders"
          className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          View orders
        </Link>
        <Link
          href="/products"
          className="rounded-lg border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
