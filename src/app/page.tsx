import Link from 'next/link';
import { ArrowRight, Truck, Shield, Headphones, Package } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-900/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-300 font-mono">
              WHOLESALE CATALOGUE · EU-WIDE
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900 font-display sm:text-5xl lg:text-6xl">
              Premium products for growing businesses
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Source high-quality products at competitive wholesale prices. Fast shipping, reliable stock, and dedicated support for resellers.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600"
              >
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400"
              >
                Create Account
              </Link>
            </div>

            {/* Signature: live spec strip — the technical, B2B-trust detail */}
            <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-neutral-200 pt-6 font-mono">
              <div>
                <dt className="text-xs text-neutral-500">MOQ</dt>
                <dd className="mt-1 text-lg font-medium text-neutral-900 tabular-nums">1 unit</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Delivery</dt>
                <dd className="mt-1 text-lg font-medium text-neutral-900 tabular-nums">2–5 days</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Stock sync</dt>
                <dd className="mt-1 text-lg font-medium text-accent-400 tabular-nums">live</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-neutral-200 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Truck,
                title: 'Fast Shipping',
                description: 'Reliable delivery across Europe within 2-5 business days.',
              },
              {
                icon: Shield,
                title: 'Quality Guaranteed',
                description: 'Every product is carefully selected and quality checked.',
              },
              {
                icon: Package,
                title: 'Wholesale Prices',
                description: 'Competitive pricing designed for resellers and businesses.',
              },
              {
                icon: Headphones,
                title: 'Dedicated Support',
                description: 'Our team is ready to help with orders and product questions.',
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10">
                  <item.icon className="h-6 w-6 text-accent-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-neutral-900 font-display">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured CTA */}
      <section className="border-b border-neutral-200 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 font-display">
            Ready to stock up?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-600">
            Browse our full catalogue of carefully selected products. Create an account for order history and faster checkout.
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 font-display">
                Popular Categories
              </h2>
              <p className="mt-2 text-neutral-600">Explore our most requested product groups</p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-accent-400 hover:text-accent-300 hover:underline sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {['Electronics', 'Home & Living', 'Outdoor', 'Accessories'].map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 transition hover:border-accent-500/40"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-sm font-semibold text-neutral-900 font-display">{cat}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
