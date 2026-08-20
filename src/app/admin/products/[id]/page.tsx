'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`).then((r) => r.json()).then((d) => {
      if (d.product) {
        setForm({
          ...d.product,
          price: String(d.product.price),
          compare_at_price: d.product.compare_at_price != null ? String(d.product.compare_at_price) : '',
          cost_price: d.product.cost_price != null ? String(d.product.cost_price) : '',
          stock: String(d.product.stock),
          min_order_quantity: String(d.product.min_order_quantity),
        });
      }
      setLoading(false);
    });
  }, [id]);

  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, slug: form.slug, description: form.description,
        short_description: form.short_description, sku: form.sku,
        price: parseFloat(form.price) || 0,
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        stock: parseInt(form.stock, 10) || 0,
        min_order_quantity: parseInt(form.min_order_quantity, 10) || 1,
        badge: form.badge, supplier_name: form.supplier_name,
        supplier_sku: form.supplier_sku, supplier_product_id: form.supplier_product_id,
        is_published: form.is_published, is_featured: form.is_featured,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
    router.push('/admin/products');
  };

  const remove = async () => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    router.push('/admin/products');
  };

  if (loading || !form) return <div className="py-20 text-center text-neutral-500">Loading...</div>;

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-900">← Back</Link>
      <h1 className="mt-2 text-2xl font-bold">Edit product</h1>
      <form onSubmit={save} className="mt-8 max-w-3xl space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Slug</label>
              <input required value={form.slug} onChange={(e) => update('slug', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">SKU</label>
              <input value={form.sku || ''} onChange={(e) => update('sku', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea rows={4} value={form.description || ''} onChange={(e) => update('description', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price</label>
              <input type="number" step="0.01" required value={form.price} onChange={(e) => update('price', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cost price</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={(e) => update('cost_price', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => update('stock', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Badge</label>
              <input value={form.badge || ''} onChange={(e) => update('badge', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Supplier name</label>
              <input value={form.supplier_name || ''} onChange={(e) => update('supplier_name', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Supplier SKU</label>
              <input value={form.supplier_sku || ''} onChange={(e) => update('supplier_sku', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => update('is_published', e.target.checked)} className="h-4 w-4 rounded" />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} className="h-4 w-4 rounded" />
              Featured
            </label>
          </div>
        </section>
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={remove}
            className="rounded-lg border border-red-200 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
