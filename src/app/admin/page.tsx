import { createServiceClient } from '@/lib/supabase/server';
import { formatPrice, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

type PaidOrder = { total: number | string };
type RecentOrder = {
  id: string;
  order_number: string;
  email: string;
  total: number | string;
  order_status: string;
  payment_status: string;
  created_at: string;
};
type LowStockProduct = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
};

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  // Stats
  const [
    { count: orderCount },
    { count: productCount },
    { count: customerCount },
    { data: recentOrders },
    { data: lowStock },
    { data: paidOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase
      .from('orders')
      .select('id, order_number, email, total, order_status, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('products')
      .select('id, name, sku, stock')
      .lte('stock', 5)
      .eq('is_published', true)
      .order('stock')
      .limit(5),
    supabase
      .from('orders')
      .select('total, cost')
      .eq('payment_status', 'paid'),
  ]);

  // Revenue calculation (simplified - real profit needs cost from order items)
  const revenue = (paidOrders as PaidOrder[] | null || []).reduce(
    (sum: number, o: PaidOrder) => sum + Number(o.total),
    0
  );

  const stats = [
    { label: 'Revenue', value: formatPrice(revenue), sub: 'Paid orders' },
    { label: 'Orders', value: String(orderCount ?? 0), sub: 'Total orders' },
    { label: 'Products', value: String(productCount ?? 0), sub: 'In catalogue' },
    { label: 'Customers', value: String(customerCount ?? 0), sub: 'Registered' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-display">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Overview of your store</p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Full analytics <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-200 bg-neutral-100/40 p-6"
          >
            <p className="text-sm font-medium text-neutral-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 font-mono tabular-nums">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-neutral-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Recent orders */}
        <div className="xl:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-100/40">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <h2 className="font-semibold text-neutral-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-neutral-500 hover:text-neutral-900">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 text-neutral-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {(recentOrders as RecentOrder[] | null || []).map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-3">
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
                    <td className="px-6 py-3 text-neutral-600">{order.email}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize">
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatPrice(Number(order.total))}
                    </td>
                  </tr>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-neutral-400">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-100/40">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h2 className="font-semibold text-neutral-900">Low stock</h2>
          </div>
          <ul className="divide-y divide-neutral-50">
            {(lowStock as LowStockProduct[] | null || []).map((p) => (
              <li key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-sm font-medium text-neutral-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  {p.sku && <p className="text-xs text-neutral-400">{p.sku}</p>}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    p.stock === 0 ? 'text-red-600' : 'text-amber-600'
                  }`}
                >
                  {p.stock}
                </span>
              </li>
            ))}
            {(!lowStock || lowStock.length === 0) && (
              <li className="px-6 py-8 text-center text-sm text-neutral-400">
                All products well stocked
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
