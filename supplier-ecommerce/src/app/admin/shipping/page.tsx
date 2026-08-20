'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', price: '', free_shipping_threshold: '', description: '' });

  const load = () => {
    fetch('/api/admin/shipping').then((r) => r.json()).then((d) => setMethods(d.methods || []));
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price) || 0,
        free_shipping_threshold: form.free_shipping_threshold ? parseFloat(form.free_shipping_threshold) : null,
        description: form.description || null,
      }),
    });
    setForm({ name: '', price: '', free_shipping_threshold: '', description: '' });
    load();
  };

  const toggle = async (m: any) => {
    await fetch('/api/admin/shipping', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, is_active: !m.is_active }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Shipping methods</h1>
      <form onSubmit={add} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Method name" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="Price" className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        <input type="number" step="0.01" value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })}
          placeholder="Free above" className="w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        <button type="submit" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">Add</button>
      </form>
      <div className="mt-6 space-y-3">
        {methods.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-neutral-500">
                {formatPrice(m.price)}
                {m.free_shipping_threshold && ` · Free above ${formatPrice(m.free_shipping_threshold)}`}
              </p>
            </div>
            <button onClick={() => toggle(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {m.is_active ? 'Active' : 'Inactive'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
