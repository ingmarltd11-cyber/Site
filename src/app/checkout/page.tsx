'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import type { ShippingMethod } from '@/types/database';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, isLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    vat_number: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'NL',
    shipping_same_as_billing: true,
    shipping_street: '',
    shipping_house_number: '',
    shipping_postal_code: '',
    shipping_city: '',
    shipping_country: 'NL',
    shipping_method_id: '',
    customer_note: '',
  });

  useEffect(() => {
    // Load shipping methods
    fetch('/api/shipping')
      .then((r) => r.json())
      .then((data) => {
        if (data.methods?.length) {
          setShippingMethods(data.methods);
          setForm((f) => ({ ...f, shipping_method_id: data.methods[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-neutral-500">
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="mt-4 inline-block text-sm font-medium underline">
          Browse products
        </Link>
      </div>
    );
  }

  const selectedShipping = shippingMethods.find(
    (m) => m.id === form.shipping_method_id
  );
  let shippingCost = selectedShipping ? Number(selectedShipping.price) : 0;
  if (
    selectedShipping?.free_shipping_threshold &&
    subtotal >= Number(selectedShipping.free_shipping_threshold)
  ) {
    shippingCost = 0;
  }

  const total = Math.max(0, subtotal + shippingCost - discountAmount);

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const applyDiscount = async () => {
    setDiscountError(null);
    if (!discountCode.trim()) return;
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscountError(data.error || 'Invalid code');
        setDiscountAmount(0);
        return;
      }
      setDiscountAmount(data.discount_amount);
    } catch {
      setDiscountError('Could not validate code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const shipping = form.shipping_same_as_billing
      ? {
          shipping_street: form.street,
          shipping_house_number: form.house_number,
          shipping_postal_code: form.postal_code,
          shipping_city: form.city,
          shipping_country: form.country,
        }
      : {
          shipping_street: form.shipping_street,
          shipping_house_number: form.shipping_house_number,
          shipping_postal_code: form.shipping_postal_code,
          shipping_city: form.shipping_city,
          shipping_country: form.shipping_country,
        };

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...shipping,
          discount_code: discountCode || undefined,
          items: items.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id || null,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Redirect to Mollie
      if (data.payment_url) {
        clearCart();
        window.location.href = data.payment_url;
      } else {
        setError('No payment URL received');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 font-display">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-5">
        {/* Form */}
        <div className="space-y-8 lg:col-span-3">
          {/* Contact */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  First name *
                </label>
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Last name *
                </label>
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Company (optional)
                </label>
                <input
                  value={form.company_name}
                  onChange={(e) => update('company_name', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  VAT number (optional)
                </label>
                <input
                  value={form.vat_number}
                  onChange={(e) => update('vat_number', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>
          </section>

          {/* Billing address */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Billing address</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Street *
                </label>
                <input
                  required
                  value={form.street}
                  onChange={(e) => update('street', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  House number *
                </label>
                <input
                  required
                  value={form.house_number}
                  onChange={(e) => update('house_number', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Postal code *
                </label>
                <input
                  required
                  value={form.postal_code}
                  onChange={(e) => update('postal_code', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  City *
                </label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Country *
                </label>
                <select
                  required
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="LU">Luxembourg</option>
                </select>
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={form.shipping_same_as_billing}
                onChange={(e) => update('shipping_same_as_billing', e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Shipping address same as billing
            </label>
          </section>

          {/* Shipping address (if different) */}
          {!form.shipping_same_as_billing && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Shipping address</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">Street *</label>
                  <input
                    required
                    value={form.shipping_street}
                    onChange={(e) => update('shipping_street', e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">House number *</label>
                  <input
                    required
                    value={form.shipping_house_number}
                    onChange={(e) => update('shipping_house_number', e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Postal code *</label>
                  <input
                    required
                    value={form.shipping_postal_code}
                    onChange={(e) => update('shipping_postal_code', e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">City *</label>
                  <input
                    required
                    value={form.shipping_city}
                    onChange={(e) => update('shipping_city', e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Country *</label>
                  <select
                    required
                    value={form.shipping_country}
                    onChange={(e) => update('shipping_country', e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="LU">Luxembourg</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Shipping method */}
          {shippingMethods.length > 0 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Shipping method</h2>
              <div className="mt-4 space-y-3">
                {shippingMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                      form.shipping_method_id === m.id
                        ? 'border-accent-500 bg-accent-500/10'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping_method"
                        checked={form.shipping_method_id === m.id}
                        onChange={() => update('shipping_method_id', m.id)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="font-medium text-neutral-900">{m.name}</p>
                        {m.description && (
                          <p className="text-sm text-neutral-500">{m.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-neutral-900">
                      {m.free_shipping_threshold &&
                      subtotal >= Number(m.free_shipping_threshold)
                        ? 'Free'
                        : formatPrice(Number(m.price))}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Note */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Order note</h2>
            <textarea
              value={form.customer_note}
              onChange={(e) => update('customer_note', e.target.value)}
              rows={3}
              placeholder="Optional notes for your order..."
              className="mt-4 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
            />
          </section>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Order summary</h2>

              <ul className="mt-4 space-y-3">
                {items.map((item) => {
                  const price =
                    (item.product?.price ?? 0) +
                    (item.variant?.price_adjustment ?? 0);
                  return (
                    <li
                      key={`${item.product_id}-${item.variant_id}`}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-neutral-600">
                        {item.product?.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Discount */}
              <div className="mt-4 flex gap-2">
                <input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Discount code"
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500"
                />
                <button
                  type="button"
                  onClick={applyDiscount}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-white"
                >
                  Apply
                </button>
              </div>
              {discountError && (
                <p className="mt-1 text-xs text-red-500">{discountError}</p>
              )}

              <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Shipping</span>
                  <span>
                    {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-accent-500 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60"
              >
                {loading ? 'Processing...' : 'Pay now'}
              </button>

              <p className="mt-3 text-center text-xs text-neutral-500">
                Secure payment via Mollie
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
