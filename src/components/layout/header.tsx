'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/products?featured=true', label: 'Best Sellers' },
  { href: '/products?sort=newest', label: 'New Arrivals' },
];

export function Header() {
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-sm font-bold text-white font-display">
            S
          </div>
          <span className="text-lg font-semibold tracking-tight text-neutral-900 font-display">
            Supplier
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-full p-2.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/account"
            className="rounded-full p-2.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>

          <Link
            href="/cart"
            className="relative rounded-full p-2.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white font-mono">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          <button
            className="rounded-full p-2.5 text-neutral-500 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-neutral-200 px-4 py-3">
          <form action="/products" method="get" className="mx-auto max-w-7xl">
            <input
              type="search"
              name="q"
              placeholder="Search products, SKU..."
              autoFocus
              className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none"
            />
          </form>
        </div>
      )}

      {/* Mobile menu */}
      <div
        className={cn(
          'border-t border-neutral-200 md:hidden',
          mobileOpen ? 'block' : 'hidden'
        )}
      >
        <nav className="flex flex-col px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="py-2.5 text-sm font-medium text-neutral-700"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/account"
            className="py-2.5 text-sm font-medium text-neutral-700"
            onClick={() => setMobileOpen(false)}
          >
            My Account
          </Link>
        </nav>
      </div>
    </header>
  );
}
