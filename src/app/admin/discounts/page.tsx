'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', min_order_amount: '0', max_uses: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/admin/discounts').then((r) => r.json()).then((d) => {
      setDiscounts(d.discounts || []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        value: parseFloat(form.value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
      }),
    });
    setForm({ code: '', type: 'percentage', value: '', min_order_amount: '0', max_uses: '' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this code?')) return;
    await fetch('/api/admin/discounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Discount codes</h1>
      <form onSubmit={add} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="CODE" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-neutral-900" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900">
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <input required type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
          placeholder="Value" className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
          placeholder="Min order" className="w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
          placeholder="Max uses" className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        <button type="submit" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">Add</button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {discounts.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-mono font-medium">{d.code}</td>
                <td className="px-4 py-3 capitalize">{d.type}</td>
                <td className="px-4 py-3">{d.type === 'percentage' ? `${d.value}%` : formatPrice(d.value)}</td>
                <td className="px-4 py-3">{d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ''}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(d.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!loading && discounts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No discount codes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
