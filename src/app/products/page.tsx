import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/products/product-card';
import { ProductFilters } from '@/components/products/product-filters';
import type { Product } from '@/types/database';

export const metadata = {
  title: 'Products',
};

interface SearchParams {
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  in_stock?: string;
  sort?: string;
  page?: string;
  featured?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, parseInt(params.page || '1', 10));
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('products')
    .select(
      `
      id, name, slug, description, short_description, sku, price, compare_at_price,
      stock, min_order_quantity, category_id, is_published, is_featured, badge,
      created_at, updated_at,
      images:product_images(id, url, alt_text, sort_order, is_primary),
      category:categories(id, name, slug)
    `,
      { count: 'exact' }
    )
    .eq('is_published', true);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%`);
  }

  if (params.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.category)
      .single();
    if (cat) {
      query = query.eq('category_id', cat.id);
    }
  }

  if (params.featured === 'true') {
    query = query.eq('is_featured', true);
  }

  if (params.in_stock === 'true') {
    query = query.gt('stock', 0);
  }

  if (params.min_price) {
    query = query.gte('price', parseFloat(params.min_price));
  }

  if (params.max_price) {
    query = query.lte('price', parseFloat(params.max_price));
  }

  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: products, count, error } = await query.range(from, to);

  if (error) {
    console.error('Products fetch error:', error);
  }

  const totalPages = Math.ceil((count || 0) / perPage);

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 font-display">
          {params.q
            ? `Search: “${params.q}”`
            : params.featured === 'true'
            ? 'Best Sellers'
            : 'Products'}
        </h1>
        <p className="mt-2 text-neutral-600">
          {count ?? 0} product{(count ?? 0) !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <ProductFilters
            categories={categories || []}
            currentParams={params as Record<string, string | undefined>}
          />
        </aside>

        <div className="flex-1">
          {!products || products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 py-20 text-center">
              <p className="text-neutral-500">No products found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {(products as unknown as Product[]).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const sp = new URLSearchParams();
                    Object.entries(params).forEach(([k, v]) => {
                      if (v && k !== 'page') sp.set(k, v);
                    });
                    if (p > 1) sp.set('page', String(p));
                    return (
                      <a
                        key={p}
                        href={`/products?${sp.toString()}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${
                          p === page
                            ? 'bg-accent-500 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {p}
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}p
