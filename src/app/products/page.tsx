import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/products/product-card';
import { ProductFilters } from '@/components/products/product-filters';
import type { PublicProduct } from '@/types/database';

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
      query = query.order('name', {
