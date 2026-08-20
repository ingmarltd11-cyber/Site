import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatPrice, formatDate } from '@/lib/utils';

export default async function AccountOrderDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/account/orders" className="text-sm text-neutral-500 hover:text-neutral-900">← Back to orders</Link>
      <h1 className="mt-2 text-2xl font-bold">{order.order_number}</h1>
      <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>

      <div className="mt-6 flex gap-2">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize">{order.payment_status}</span>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize">{order.order_status}</span>
      </div>

      {order.tracking_number && (
        <p className="mt-4 text-sm">Tracking: <span className="font-medium">{order.tracking_number}</span></p>
      )}

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold">Items</h2>
        <ul className="mt-4 divide-y divide-neutral-100">
          {(order.order_items || []).map((item: any) => (
            <li key={item.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-neutral-500">Qty: {item.quantity}</p>
              </div>
              <span className="font-medium">{formatPrice(item.total_price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-neutral-100 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{formatPrice(order.shipping_cost)}</span></div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{formatPrice(order.discount_amount)}</span></div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm">
        <h2 className="font-semibold">Shipping address</h2>
        <p className="mt-2">{order.shipping_street} {order.shipping_house_number}</p>
        <p>{order.shipping_postal_code} {order.shipping_city}</p>
        <p>{order.shipping_country}</p>
      </section>
    </div>
  );
}
