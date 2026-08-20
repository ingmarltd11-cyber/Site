'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initial: {
    store_name: string;
    store_email: string;
    support_email: string;
    currency: string;
    store_description: string;
    free_shipping_threshold: string;
    default_shipping_price: string;
  };
}

export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed');
      } else {
        setMessage('Settings saved');
        router.refresh();
      }
    } catch {
      setMessage('Network error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
      {(
        [
          ['store_name', 'Store name'],
          ['store_email', 'Store email'],
          ['support_email', 'Support email'],
          ['currency', 'Currency'],
          ['store_description', 'Store description'],
          ['free_shipping_threshold', 'Free shipping threshold (€)'],
          ['default_shipping_price', 'Default shipping price (€)'],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <label className="mb-1.5 block text-sm font-medium">{label}</label>
          {key === 'store_description' ? (
            <textarea
              rows={3}
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          ) : (
            <input
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          )}
        </div>
      ))}

      {message && (
        <p
          className={`text-sm ${
            message === 'Settings saved' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? 'Saving...' : 'Save settings'}
      </button>
    </form>
  );
}
