'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DiscountForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_order_amount: '0',
    max_uses: '',
    is_active: true,
  });

  const update = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          type: form.type,
          value: parseFloat(form.value) || 0,
          min_order_amount: parseFloat(form.min_order_amount) || 0,
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
        setLoading(false);
        return;
      }
      setForm({
        code: '',
        type: 'percentage',
        value: '',
        min_order_amount: '0',
        max_uses: '',
        is_active: true,
      });
      setLoading(false);
      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4"
    >
      <h2 className="font-semibold text-neutral-900">Create discount</h2>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Code</label>
        <input
          required
          value={form.code}
          onChange={(e) => update('code', e.target.value.toUpperCase())}
          placeholder="SUMMER20"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Type</label>
        <select
          value={form.type}
          onChange={(e) => update('type', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Value {form.type === 'percentage' ? '(%)' : '(€)'}
        </label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={form.value}
          onChange={(e) => update('value', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Min. order amount</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.min_order_amount}
          onChange={(e) => update('min_order_amount', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Max uses (optional)</label>
        <input
          type="number"
          min="1"
          value={form.max_uses}
          onChange={(e) => update('max_uses', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? 'Creating...' : 'Create code'}
      </button>
    </form>
  );
}
