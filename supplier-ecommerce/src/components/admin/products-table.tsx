'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Upload, Download, Check, X, Loader2 } from 'lucide-react';

interface AdminProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost_price: number | null;
  stock: number;
  is_published: boolean;
  is_featured: boolean;
  badge: string | null;
  category: { name: string } | null;
}

interface ImportSummary {
  created: number;
  updated: number;
  failed: number;
  errors: { sku: string; message: string }[];
}

export function ProductsTable({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0 && !allSelected;

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function runBulkAction(action: string, percent?: number) {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selectedIds.length} product(s)? This cannot be undone.`)) {
      return;
    }
    if (action === 'adjust_price' && percent === undefined) {
      const input = prompt('Adjust price by percentage (e.g. -10 for -10%, 5 for +5%)');
      if (!input) return;
      percent = parseFloat(input);
      if (Number.isNaN(percent)) return;
    }

    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'action', action, ids: selectedIds, percent }),
    });
    if (res.ok) {
      setSelected(new Set());
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Bulk action failed');
    }
  }

  function exportCsv() {
    const rows = products.filter((p) => selected.size === 0 || selected.has(p.id));
    const header = ['sku', 'name', 'price', 'cost_price', 'stock', 'is_published'];
    const lines = [
      header.join(','),
      ...rows.map((p) =>
        [
          p.sku || '',
          `"${p.name.replace(/"/g, '""')}"`,
          p.price,
          p.cost_price ?? '',
          p.stock,
          p.is_published,
        ].join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text: string) {
    const lines = text.trim().split('\n');
    const header = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      // simple CSV split respecting quoted commas
      const values: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === ',' && !inQuotes) {
          values.push(cur);
          cur = '';
        } else cur += ch;
      }
      values.push(cur);
      const row: Record<string, string> = {};
      header.forEach((h, i) => (row[h] = (values[i] || '').replace(/^"|"$/g, '').trim()));
      return row;
    });
  }

  async function handleFile(file: File) {
    const text = await file.text();
    const rows = parseCsv(text)
      .filter((r) => r.sku && r.name)
      .map((r) => ({
        sku: r.sku,
        name: r.name,
        price: parseFloat(r.price) || 0,
        cost_price: r.cost_price ? parseFloat(r.cost_price) : null,
        stock: r.stock ? parseInt(r.stock, 10) : 0,
        is_published: r.is_published === 'true',
      }));

    if (rows.length === 0) {
      alert('No valid rows found. Expected columns: sku,name,price,cost_price,stock,is_published');
      return;
    }

    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'import', rows }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportSummary(data);
      startTransition(() => router.refresh());
    } else {
      alert(data.error || 'Import failed');
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <Download className="h-4 w-4" />
          {selected.size > 0 ? `Export selected (${selected.size})` : 'Export all as CSV'}
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-3">
          <span className="text-sm font-medium text-neutral-900">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button onClick={() => runBulkAction('publish')} disabled={isPending} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200">
              Publish
            </button>
            <button onClick={() => runBulkAction('unpublish')} disabled={isPending} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200">
              Unpublish
            </button>
            <button onClick={() => runBulkAction('feature')} disabled={isPending} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200">
              Feature
            </button>
            <button onClick={() => runBulkAction('adjust_price')} disabled={isPending} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200">
              Adjust price %
            </button>
            <button onClick={() => runBulkAction('delete')} disabled={isPending} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20">
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-100 text-neutral-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-neutral-300 accent-accent-500"
                />
              </th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Margin</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((p) => {
              const margin =
                p.cost_price && p.price
                  ? (((p.price - p.cost_price) / p.price) * 100).toFixed(0)
                  : null;
              return (
                <tr key={p.id} className={selected.has(p.id) ? 'bg-accent-500/5' : 'hover:bg-neutral-100'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="h-4 w-4 rounded border-neutral-300 accent-accent-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-neutral-900 hover:underline">
                      {p.name}
                    </Link>
                    {p.badge && (
                      <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium uppercase">
                        {p.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-500">{p.sku || '—'}</td>
                  <td className="px-4 py-3 font-mono font-medium tabular-nums">{formatPrice(Number(p.price))}</td>
                  <td className="px-4 py-3 font-mono text-neutral-500 tabular-nums">
                    {p.cost_price ? formatPrice(Number(p.cost_price)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{margin !== null ? `${margin}%` : '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock === 0
                          ? 'font-medium text-red-500'
                          : p.stock <= 5
                            ? 'font-medium text-amber-500'
                            : ''
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {p.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-neutral-400">
                  No products yet.{' '}
                  <Link href="/admin/products/new" className="underline">
                    Add your first product
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 font-display">Import products (CSV)</h2>
              <button onClick={() => { setImportOpen(false); setImportSummary(null); }} className="text-neutral-500 hover:text-neutral-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Columns: <code className="font-mono text-xs">sku,name,price,cost_price,stock,is_published</code>. Existing SKUs are updated, new SKUs are created.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="mt-4 w-full text-sm text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-accent-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent-600"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {isPending && (
              <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </div>
            )}

            {importSummary && (
              <div className="mt-4 rounded-lg border border-neutral-200 p-3 text-sm">
                <p className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="h-4 w-4" /> {importSummary.created} created, {importSummary.updated} updated
                </p>
                {importSummary.failed > 0 && (
                  <p className="mt-1 text-red-400">{importSummary.failed} failed</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
