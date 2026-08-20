import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Package, User, LogOut } from 'lucide-react';

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, order_status, payment_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">My account</h1>
      <p className="mt-1 text-neutral-600">
        Welcome back, {profile?.first_name || user.email}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
            <Package className="h-6 w-6 text-neutral-700" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">Orders</h2>
            <p className="text-sm text-neutral-500">View order history</p>
          </div>
        </Link>

        <Link
          href="/account/profile"
          className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
            <User className="h-6 w-6 text-neutral-700" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">Profile</h2>
            <p className="text-sm text-neutral-500">Edit your details</p>
          </div>
        </Link>

        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
              <LogOut className="h-6 w-6 text-neutral-700" />
            </div>
            <div className="text-left">
              <h2 className="font-semibold text-neutral-900">Sign out</h2>
              <p className="text-sm text-neutral-500">Log out of your account</p>
            </div>
          </button>
        </form>
      </div>

      {/* Recent orders */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-medium text-neutral-600 hover:underline">
            View all
          </Link>
        </div>

        {!orders || orders.length === 0 ? (
          <p className="mt-6 text-neutral-500">No orders yet.</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-neutral-600">Order</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">Date</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">Status</th>
                  <th className="px-4 py-3 font-medium text-neutral-600 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(order.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-700">
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      €{Number(order.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
