import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { ProductsTable } from '@/components/admin/products-table';
import { Plus } from 'lucide-react';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from('products')
    .select(
      'id, name, sku, price, cost_price, stock, is_published, is_featured, badge, created_at, category:categories(name)'
    )
    .order('created_at', { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const { data: products } = await query.limit(200);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-display">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your product catalogue
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {/* Search */}
      <form className="mt-6">
        <input
          name="q"
          defaultValue={q || ''}
          placeholder="Search by name or SKU..."
          className="w-full max-w-md rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
        />
      </form>

      <ProductsTable products={(products as never) || []} />
    </div>
  );
}
