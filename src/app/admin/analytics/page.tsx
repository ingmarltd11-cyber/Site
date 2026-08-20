import { createServiceClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

export const metadata = { title: 'Analytics' };

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d: string | Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  const supabase = createServiceClient();
  const periodDays = 30;
  const currentStart = daysAgo(periodDays);
  const previousStart = daysAgo(periodDays * 2);

  const [{ data: currentOrders }, { data: previousOrders }, { data: statusCounts }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, created_at, order_status')
      .eq('payment_status', 'paid')
      .gte('created_at', currentStart.toISOString()),
    supabase
      .from('orders')
      .select('id, total')
      .eq('payment_status', 'paid')
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', currentStart.toISOString()),
    supabase.from('orders').select('order_status').gte('created_at', currentStart.toISOString()),
  ]);

  const orderIds = (currentOrders || []).map((o: { id: string }) => o.id);
  const { data: items } = orderIds.length
    ? await supabase
        .from('order_items')
        .select('product_id, product_name, product_sku, quantity, total_price, order_id')
        .in('order_id', orderIds)
    : { data: [] as { product_id: string | null; product_name: string; product_sku: string | null; quantity: number; total_price: number; order_id: string }[] };

  // --- Headline metrics ---
  const revenue = (currentOrders || []).reduce((s: number, o: { total: number }) => s + Number(o.total), 0);
  const prevRevenue = (previousOrders || []).reduce((s: number, o: { total: number }) => s + Number(o.total), 0);
  const orderCount = (currentOrders || []).length;
  const prevOrderCount = (previousOrders || []).length;
  const aov = orderCount ? revenue / orderCount : 0;
  const prevAov = prevOrderCount ? prevRevenue / prevOrderCount : 0;

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const metrics = [
    { label: 'Revenue', value: formatPrice(revenue), change: pctChange(revenue, prevRevenue) },
    { label: 'Orders', value: String(orderCount), change: pctChange(orderCount, prevOrderCount) },
    { label: 'Avg. order value', value: formatPrice(aov), change: pctChange(aov, prevAov) },
  ];

  // --- Daily revenue trend ---
  const dailyMap = new Map<string, number>();
  for (let i = periodDays - 1; i >= 0; i--) {
    dailyMap.set(dateKey(daysAgo(i)), 0);
  }
  for (const o of currentOrders || []) {
    const key = dateKey(o.created_at);
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + Number(o.total));
  }
  const dailySeries = Array.from(dailyMap.entries());
  const maxDaily = Math.max(1, ...dailySeries.map(([, v]) => v));

  // --- Top products by revenue ---
  const productMap = new Map<string, { name: string; sku: string | null; revenue: number; units: number }>();
  for (const item of items || []) {
    const key = item.product_id || item.product_name;
    const entry = productMap.get(key) || { name: item.product_name, sku: item.product_sku, revenue: 0, units: 0 };
    entry.revenue += Number(item.total_price);
    entry.units += item.quantity;
    productMap.set(key, entry);
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
  const maxProductRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));

  // --- Orders by status ---
  const statusMap = new Map<string, number>();
  for (const o of statusCounts || []) {
    statusMap.set(o.order_status, (statusMap.get(o.order_status) || 0) + 1);
  }
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500',
    paid: 'bg-accent-500',
    processing: 'bg-accent-400',
    shipped: 'bg-emerald-500',
    completed: 'bg-emerald-400',
    cancelled: 'bg-neutral-400',
    refunded: 'bg-red-500',
  };
  const totalStatusCount = Array.from(statusMap.values()).reduce((s, v) => s + v, 0) || 1;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-display">Analytics</h1>
      <p className="mt-1 text-sm text-neutral-500">Last {periodDays} days vs. previous {periodDays} days</p>

      {/* Headline metrics */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-neutral-200 bg-neutral-100/40 p-6">
            <p className="text-sm font-medium text-neutral-500">{m.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 font-mono tabular-nums">
              {m.value}
            </p>
            <p className={`mt-1 text-xs font-medium ${m.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.change >= 0 ? '↑' : '↓'} {Math.abs(m.change).toFixed(1)}% vs previous period
            </p>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-100/40 p-6">
        <h2 className="font-semibold text-neutral-900 font-display">Daily revenue</h2>
        <div className="mt-6 flex h-40 items-end gap-1">
          {dailySeries.map(([date, value]) => (
            <div key={date} className="group relative flex-1">
              <div
                className="rounded-t bg-accent-500/70 transition group-hover:bg-accent-500"
                style={{ height: `${Math.max(2, (value / maxDaily) * 100)}%`, minHeight: '2px' }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-200 px-2 py-1 text-[11px] font-mono text-neutral-900 group-hover:block">
                {date}: {formatPrice(value)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-neutral-500">
          <span>{dailySeries[0]?.[0]}</span>
          <span>{dailySeries[dailySeries.length - 1]?.[0]}</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Top products */}
        <div className="xl:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-100/40">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="font-semibold text-neutral-900 font-display">Top products by revenue</h2>
          </div>
          <ul className="divide-y divide-neutral-200">
            {topProducts.map((p) => (
              <li key={p.sku || p.name} className="px-6 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{p.name}</p>
                    <p className="font-mono text-xs text-neutral-500">
                      {p.sku || '—'} · {p.units} units
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold text-neutral-900 tabular-nums">
                    {formatPrice(p.revenue)}
                  </p>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-neutral-200">
                  <div
                    className="h-1.5 rounded-full bg-accent-500"
                    style={{ width: `${(p.revenue / maxProductRevenue) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {topProducts.length === 0 && (
              <li className="px-6 py-8 text-center text-sm text-neutral-400">No sales in this period</li>
            )}
          </ul>
        </div>

        {/* Orders by status */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-100/40">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="font-semibold text-neutral-900 font-display">Orders by status</h2>
          </div>
          <div className="p-6">
            <div className="flex h-3 overflow-hidden rounded-full bg-neutral-200">
              {Array.from(statusMap.entries()).map(([status, count]) => (
                <div
                  key={status}
                  className={statusColors[status] || 'bg-neutral-400'}
                  style={{ width: `${(count / totalStatusCount) * 100}%` }}
                  title={`${status}: ${count}`}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {Array.from(statusMap.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${statusColors[status] || 'bg-neutral-400'}`} />
                    <span className="capitalize text-neutral-700">{status}</span>
                    <span className="ml-auto font-mono text-neutral-500 tabular-nums">{count}</span>
                  </li>
                ))}
              {statusMap.size === 0 && (
                <li className="text-center text-sm text-neutral-400">No orders in this period</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
