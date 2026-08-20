'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types/database';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const images = (product.images || []).sort((a, b) => a.sort_order - b.sort_order);
  const variants = (product.variants || []).filter((v) => v.is_active);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] || null
  );
  const [quantity, setQuantity] = useState(product.min_order_quantity || 1);
  const [added, setAdded] = useState(false);

  const currentPrice =
    product.price + (selectedVariant?.price_adjustment || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock = currentStock > 0;
  const onSale =
    product.compare_at_price && product.compare_at_price > product.price;

  const handleAdd = () => {
    if (!inStock) return;
    addItem(product, quantity, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      {/* Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
          {images[selectedImage] ? (
            <Image
              src={images[selectedImage].url}
              alt={images[selectedImage].alt_text || product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              No image
            </div>
          )}
          {product.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold uppercase text-white">
              {product.badge}
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(i)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === selectedImage
                    ? 'border-accent-500'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || ''}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col">
        {product.category && (
          <Link
            href={`/products?category=${product.category.slug}`}
            className="mb-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            {product.category.name}
          </Link>
        )}

        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 font-display">
          {product.name}
        </h1>

        {product.sku && (
          <p className="mt-1 text-sm text-neutral-500">SKU: {product.sku}</p>
        )}

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
            {formatPrice(currentPrice)}
          </span>
          {onSale && (
            <span className="text-lg text-neutral-400 line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        <div className="mt-2">
          {inStock ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              In stock ({currentStock} available)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Out of stock
            </span>
          )}
        </div>

        {product.short_description && (
          <p className="mt-6 text-neutral-600 leading-relaxed">
            {product.short_description}
          </p>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">
              {variants[0].name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  disabled={v.stock <= 0}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    selectedVariant?.id === v.id
                      ? 'border-accent-500 bg-accent-500 text-white'
                      : v.stock <= 0
                        ? 'cursor-not-allowed border-neutral-200 text-neutral-300'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {v.value}
                  {v.price_adjustment !== 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      ({v.price_adjustment > 0 ? '+' : ''}
                      {formatPrice(v.price_adjustment)})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-neutral-900">Quantity</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-neutral-200">
              <button
                onClick={() =>
                  setQuantity(Math.max(product.min_order_quantity || 1, quantity - 1))
                }
                className="p-2.5 text-neutral-600 hover:text-neutral-900"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity(Math.min(currentStock, quantity + 1))
                }
                className="p-2.5 text-neutral-600 hover:text-neutral-900"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {product.min_order_quantity > 1 && (
              <span className="text-xs text-neutral-500">
                Min. {product.min_order_quantity}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </>
            )}
          </button>
          <Link
            href="/checkout"
            onClick={() => {
              if (inStock) addItem(product, quantity, selectedVariant);
            }}
            className={`flex flex-1 items-center justify-center rounded-lg border border-accent-500 px-6 py-3.5 text-sm font-semibold transition ${
              inStock
                ? 'text-accent-400 hover:bg-accent-500/10'
                : 'pointer-events-none border-neutral-300 text-neutral-300'
            }`}
          >
            Buy now
          </Link>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-10 border-t border-neutral-200 pt-8">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              Description
            </h2>
            <div className="prose prose-neutral max-w-none text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
