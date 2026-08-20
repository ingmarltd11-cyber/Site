'use client';

import { useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    store_name: '', store_email: '', support_email: '', currency: 'EUR',
    store_description: '', free_shipping_threshold: '100', default_shipping_price: '6.95',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then((d) => {
      if (d.settings) {
        setForm((f) => ({
          ...f,
          store_name: String(d.settings.store_name || '').replace(/"/g, ''),
          store_email: String(d.settings.store_email || '').replace(/"/g, ''),
          support_email: String(d.settings.support_email || '').replace(/"/g, ''),
          currency: String(d.settings.currency || 'EUR').replace(/"/g, ''),
          store_description: String(d.settings.store_description || '').replace(/"/g, ''),
          free_shipping_threshold: String(d.settings.free_shipping_threshold ?? '100'),
          default_shipping_price: String(d.settings.default_shipping_price ?? '6.95'),
        }));
      }
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: form.store_name,
        store_email: form.store_email,
        support_email: form.support_email,
        currency: form.currency,
        store_description: form.store_description,
        free_shipping_threshold: parseFloat(form.free_shipping_threshold),
        default_shipping_price: parseFloat(form.default_shipping_price),
      }),
    });
    setSaving(false);
    setMessage('Settings saved');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Store settings</h1>
      <form onSubmit={save} className="mt-8 max-w-xl space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          {(['store_name', 'store_email', 'support_email', 'currency', 'store_description'] as const).map((key) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Free shipping threshold</label>
              <input type="number" step="0.01" value={form.free_shipping_threshold}
                onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Default shipping price</label>
              <input type="number" step="0.01" value={form.default_shipping_price}
                onChange={(e) => setForm({ ...form, default_shipping_price: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
          </div>
        </section>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button type="submit" disabled={saving}
          className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
