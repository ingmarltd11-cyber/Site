'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, itemCount, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton h-8 w-56 rounded-lg" />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-16 w-16 text-neutral-300" />
        <h1 className="mt-6 text-2xl font-bold text-neutral-900 font-display">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600">Add some products to get started.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 font-display">
        Shopping cart
      </h1>
      <p className="mt-1 text-neutral-600">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price =
              (item.product?.price ?? 0) + (item.variant?.price_adjustment ?? 0);
            const image =
              item.product?.images?.find((i) => i.is_primary) ||
              item.product?.images?.[0];

            return (
              <div
                key={`${item.product_id}-${item.variant_id || 'default'}`}
                className="flex gap-4 rounded-2xl border border-neutral-200 bg-neutral-100/40 p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={item.product?.name || ''}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                      No img
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <div>
                      <Link
                        href={`/products/${item.product?.slug}`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {item.product?.name || 'Product'}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-neutral-500">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-neutral-900 font-mono tabular-nums">
                      {formatPrice(price * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-lg border border-neutral-200">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            item.quantity - 1,
                            item.variant_id
                          )
                        }
                        className="p-2 text-neutral-600 hover:text-neutral-900"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            item.quantity + 1,
                            item.variant_id
                          )
                        }
                        className="p-2 text-neutral-600 hover:text-neutral-900"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        removeItem(item.product_id, item.variant_id)
                      }
                      className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 font-display">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium text-neutral-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Shipping</span>
              <span className="text-neutral-500">Calculated at checkout</span>
            </div>
          </div>
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center rounded-lg bg-accent-500 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/products"
            className="mt-3 flex w-full items-center justify-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
