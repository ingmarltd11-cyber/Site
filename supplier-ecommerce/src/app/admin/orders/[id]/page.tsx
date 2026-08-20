'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) {
          setOrder(d.order);
          setStatus(d.order.order_status);
          setTracking(d.order.tracking_number || '');
          setNote(d.order.admin_note || '');
        }
        setLoading(false);
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: status, tracking_number: tracking, admin_note: note }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setOrder(data.order);
      setMessage('Saved successfully');
    } else {
      setMessage(data.error || 'Error');
    }
  };

  if (loading) return <div className="py-20 text-center text-neutral-500">Loading...</div>;
  if (!order) return <div className="py-20 text-center">Order not found</div>;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-neutral-500 hover:text-neutral-900">← Back to orders</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize">{order.payment_status}</span>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize">{order.order_status}</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold">Items</h2>
            <ul className="mt-4 divide-y divide-neutral-100">
              {(order.order_items || []).map((item: any) => (
                <li key={item.id} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-neutral-500">
                      {item.product_sku && `SKU: ${item.product_sku} · `}
                      Qty: {item.quantity} × {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <span className="font-medium">{formatPrice(item.total_price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{formatPrice(order.shipping_cost)}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Discount ({order.discount_code})</span><span>−{formatPrice(order.discount_amount)}</span></div>
              )}
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold">
                <span>Total</span><span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Customer */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold">Customer</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-neutral-500">Name</p>
                <p className="font-medium">{order.first_name} {order.last_name}</p>
              </div>
              <div>
                <p className="text-neutral-500">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
              {order.phone && <div><p className="text-neutral-500">Phone</p><p className="font-medium">{order.phone}</p></div>}
              {order.company_name && <div><p className="text-neutral-500">Company</p><p className="font-medium">{order.company_name}</p></div>}
              {order.vat_number && <div><p className="text-neutral-500">VAT</p><p className="font-medium">{order.vat_number}</p></div>}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-neutral-500">Billing</p>
                <p>{order.billing_street} {order.billing_house_number}</p>
                <p>{order.billing_postal_code} {order.billing_city}</p>
                <p>{order.billing_country}</p>
              </div>
              <div>
                <p className="text-neutral-500">Shipping</p>
                <p>{order.shipping_street} {order.shipping_house_number}</p>
                <p>{order.shipping_postal_code} {order.shipping_city}</p>
                <p>{order.shipping_country}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold">Update order</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tracking number</label>
              <input value={tracking} onChange={(e) => setTracking(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Admin note</label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            <button onClick={save} disabled={saving}
              className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </section>

          {order.payments?.length > 0 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h2 className="font-semibold">Payments</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {order.payments.map((p: any) => (
                  <li key={p.id} className="flex justify-between">
                    <span className="text-neutral-500">{p.mollie_payment_id}</span>
                    <span className="capitalize font-medium">{p.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
