'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', company_name: '', vat_number: '', email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          company_name: data.company_name || '',
          vat_number: data.vat_number || '',
          email: data.email || user.email || '',
        });
      }
      setLoading(false);
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      company_name: form.company_name || null,
      vat_number: form.vat_number || null,
    }).eq('id', user.id);
    setSaving(false);
    setMessage(error ? error.message : 'Profile updated');
  };

  if (loading) return <div className="py-20 text-center text-neutral-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href="/account" className="text-sm text-neutral-500 hover:text-neutral-900">← Back</Link>
      <h1 className="mt-2 text-2xl font-bold">Profile</h1>
      <form onSubmit={save} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">First name</label>
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Last name</label>
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input disabled value={form.email} className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Company</label>
          <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">VAT number</label>
          <input value={form.vat_number} onChange={(e) => setForm({ ...form, vat_number: e.target.value })}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button type="submit" disabled={saving}
          className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
