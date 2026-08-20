'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const primaryImage = product.images?.find((i) => i.is_primary) || product.images?.[0];
  const onSale = product.compare_at_price && product.compare_at_price > product.price;
  const inStock = product.stock > 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100/40 transition hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-900/20">
      <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-neutral-100">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text || product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            No image
          </div>
        )}
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            {product.badge}
          </span>
        )}
        {onSale && !product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Sale
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 group-hover:underline">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-neutral-900 font-mono tabular-nums">
            {formatPrice(product.price)}
          </span>
          {onSale && (
            <span className="text-sm text-neutral-500 line-through font-mono tabular-nums">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        {/* Spec strip: the wholesale-trust detail — SKU, MOQ, stock at a glance */}
        <div className="mt-2.5 flex items-center gap-3 border-t border-neutral-200 pt-2.5 font-mono text-[11px] text-neutral-500">
          {product.sku && <span className="truncate">SKU {product.sku}</span>}
          {product.min_order_quantity > 1 && (
            <span className="shrink-0">MOQ {product.min_order_quantity}</span>
          )}
          <span className={`ml-auto shrink-0 ${inStock ? 'text-emerald-400' : 'text-red-400'}`}>
            {inStock ? '● in stock' : '○ out of stock'}
          </span>
        </div>

        <button
          onClick={() => inStock && addItem(product)}
          disabled={!inStock}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to cart
        </button>
      </div>
    </div>
  );
}
