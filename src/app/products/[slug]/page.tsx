import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductDetail } from '@/components/products/product-detail';
import { ProductCard } from '@/components/products/product-card';
import type { Product } from '@/types/database';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('name, short_description, meta_title, meta_description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!data) return { title: 'Product not found' };

  return {
    title: data.meta_title || data.name,
    description: data.meta_description || data.short_description || undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, description, short_description, sku, price, compare_at_price,
      stock, min_order_quantity, category_id, is_published, is_featured, badge,
      created_at, updated_at,
      images:product_images(id, url, alt_text, sort_order, is_primary),
      variants:product_variants(id, name, value, sku, price_adjustment, stock, is_active),
      category:categories(id, name, slug)
    `
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !product) {
    notFound();
  }

  // Related products (same category)
  let related: Product[] = [];
  if (product.category_id) {
    const { data } = await supabase
      .from('products')
      .select(
        `
        id, name, slug, price, compare_at_price, stock, badge, is_featured,
        images:product_images(id, url, alt_text, sort_order, is_primary)
      `
      )
      .eq('is_published', true)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .limit(4);

    related = (data as unknown as Product[]) || [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductDetail product={product as unknown as Product} />

      {related.length > 0 && (
        <section className="mt-20 border-t border-neutral-200 pt-16">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-neutral-900">
            Related products
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
