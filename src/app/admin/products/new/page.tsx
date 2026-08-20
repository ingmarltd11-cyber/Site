'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', short_description: '', sku: '',
    price: '', compare_at_price: '', cost_price: '', stock: '0',
    min_order_quantity: '1', badge: '', supplier_name: '', supplier_sku: '',
    supplier_product_id: '', is_published: false, is_featured: false, image_url: '',
  });

  const update = (key: string, value: string | boolean) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !f.slug) {
        next.slug = String(value).toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
          compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
          cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
          stock: parseInt(form.stock, 10) || 0,
          min_order_quantity: parseInt(form.min_order_quantity, 10) || 1,
          image_url: form.image_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return; }
      router.push('/admin/products');
    } catch { setError('Network error'); setLoading(false); }
  };

  const field = (label: string, key: string, opts?: { type?: string; required?: boolean; full?: boolean; placeholder?: string }) => (
    <div className={opts?.full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={opts?.type || 'text'}
        required={opts?.required}
        value={(form as Record<string, string | boolean>)[key] as string}
        onChange={(e) => update(key, e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
      />
    </div>
  );

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-900">← Back</Link>
      <h1 className="mt-2 text-2xl font-bold">Add product</h1>
      <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Basic</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('Name *', 'name', { required: true, full: true })}
            {field('Slug *', 'slug', { required: true })}
            {field('SKU', 'sku')}
            {field('Short description', 'short_description', { full: true })}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            {field('Image URL', 'image_url', { full: true, placeholder: 'https://...' })}
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Pricing & stock</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {field('Price *', 'price', { type: 'number', required: true })}
            {field('Compare-at', 'compare_at_price', { type: 'number' })}
            {field('Cost price', 'cost_price', { type: 'number' })}
            {field('Stock', 'stock', { type: 'number' })}
            {field('Min order qty', 'min_order_quantity', { type: 'number' })}
            {field('Badge', 'badge', { placeholder: 'New, Sale...' })}
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Supplier (admin only)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {field('Supplier name', 'supplier_name')}
            {field('Supplier SKU', 'supplier_sku')}
            {field('Supplier product ID', 'supplier_product_id')}
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => update('is_published', e.target.checked)} className="h-4 w-4 rounded" />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} className="h-4 w-4 rounded" />
            Featured
          </label>
        </section>
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <button type="submit" disabled={loading}
          className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
          {loading ? 'Saving...' : 'Create product'}
        </button>
      </form>
    </div>
  );
}
