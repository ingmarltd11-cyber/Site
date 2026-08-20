'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, Category } from '@/types/database';

interface Props {
  product: Product;
  categories: Pick<Category, 'id' | 'name'>[];
}

export function ProductEditForm({ product, categories }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    short_description: product.short_description || '',
    sku: product.sku || '',
    price: String(product.price ?? ''),
    compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : '',
    cost_price: product.cost_price != null ? String(product.cost_price) : '',
    stock: String(product.stock ?? 0),
    min_order_quantity: String(product.min_order_quantity ?? 1),
    badge: product.badge || '',
    is_published: product.is_published ?? false,
    is_featured: product.is_featured ?? false,
    category_id: product.category_id || '',
    supplier_name: product.supplier_name || '',
    supplier_sku: product.supplier_sku || '',
    supplier_product_id: product.supplier_product_id || '',
  });

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          ...form,
          price: parseFloat(form.price) || 0,
          compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
          cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
          stock: parseInt(form.stock, 10) || 0,
          min_order_quantity: parseInt(form.min_order_quantity, 10) || 1,
          category_id: form.category_id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product permanently?')) return;
    setLoading(true);
    const res = await fetch(`/api/admin/products?id=${product.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/products');
    } else {
      setError('Failed to delete');
      setLoading(false);
    }
  };

  const margin =
    form.cost_price && form.price
      ? (
          ((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) *
          100
        ).toFixed(1)
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold">Basic info</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">SKU</label>
            <input
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => update('category_id', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Short description</label>
          <input
            value={form.short_description}
            onChange={(e) => update('short_description', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold">Pricing & stock</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Selling price *</label>
            <input
              required
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Compare-at</label>
            <input
              type="number"
              step="0.01"
              value={form.compare_at_price}
              onChange={(e) => update('compare_at_price', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Cost price</label>
            <input
              type="number"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => update('cost_price', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => update('stock', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Min order qty</label>
            <input
              type="number"
              value={form.min_order_quantity}
              onChange={(e) => update('min_order_quantity', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Badge</label>
            <input
              value={form.badge}
              onChange={(e) => update('badge', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
        {margin !== null && (
          <p className="text-sm text-neutral-500">
            Profit margin: <span className="font-medium text-neutral-900">{margin}%</span>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold">Supplier info (never shown to customers)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Supplier name</label>
            <input
              value={form.supplier_name}
              onChange={(e) => update('supplier_name', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Supplier SKU</label>
            <input
              value={form.supplier_sku}
              onChange={(e) => update('supplier_sku', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Supplier product ID</label>
            <input
              value={form.supplier_product_id}
              onChange={(e) => update('supplier_product_id', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
        <h2 className="font-semibold">Status</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => update('is_published', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => update('is_featured', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Featured
        </label>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Product saved
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg border border-red-200 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </form>
  );
}
