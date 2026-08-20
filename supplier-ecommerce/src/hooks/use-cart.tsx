'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CartItem, Product, ProductVariant } from '@/types/database';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'supplier_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  // Persist
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, isLoading]);

  const addItem = useCallback(
    (product: Product, quantity = 1, variant: ProductVariant | null = null) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.product_id === product.id &&
            (i.variant_id || null) === (variant?.id || null)
        );

        if (existing) {
          return prev.map((i) =>
            i.product_id === product.id &&
            (i.variant_id || null) === (variant?.id || null)
              ? { ...i, quantity: i.quantity + quantity, product, variant: variant || undefined }
              : i
          );
        }

        return [
          ...prev,
          {
            product_id: product.id,
            variant_id: variant?.id || null,
            quantity,
            product,
            variant: variant || undefined,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string, variantId?: string | null) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(i.product_id === productId && (i.variant_id || null) === (variantId || null))
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string | null) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === productId && (i.variant_id || null) === (variantId || null)
            ? { ...i, quantity }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, i) => {
    const price = i.product?.price ?? 0;
    const adjustment = i.variant?.price_adjustment ?? 0;
    return sum + (price + adjustment) * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
