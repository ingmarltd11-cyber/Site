import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { formatPrice, formatDate } from '@/lib/utils';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, email, first_name, last_name, total, order_status, payment_status, created_at'
    )
    .order('created_at', { ascending: false });

  if (params.q) {
    query = query.or(
      `order_number.ilike.%${params.q}%,email.ilike.%${params.q}%,first_name.ilike.%${params.q}%,last_name.ilike.%${params.q}%`
    );
  }
  if (params.status) {
    query = query.eq('order_status', params.status);
  }

  const { data: orders } = await query.limit(50);

  const statuses = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'completed',
    'cancelled',
    'refunded',
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage customer orders</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <form>
          <input
            name="q"
            defaultValue={params.q || ''}
            placeholder="Search order #, email, name..."
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </form>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin/orders"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !params.status
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All
          </Link>
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                params.status === s
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(orders || []).map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-neutral-400">
                    {formatDate(order.created_at)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-neutral-900">
                    {order.first_name} {order.last_name}
                  </p>
                  <p className="text-xs text-neutral-400">{order.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize">
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize">
                    {order.order_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatPrice(Number(order.total))}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
