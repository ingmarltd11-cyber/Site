import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-sm font-bold text-white font-display">
                S
              </div>
              <span className="text-lg font-semibold text-neutral-900 font-display">Supplier</span>
            </div>
            <p className="text-sm text-neutral-600">
              Premium quality products for resellers and businesses. Reliable supply, competitive prices.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-neutral-900">Shop</h3>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li>
                <Link href="/products" className="hover:text-neutral-900">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="hover:text-neutral-900">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/products?sort=newest" className="hover:text-neutral-900">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-neutral-900">Account</h3>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li>
                <Link href="/account" className="hover:text-neutral-900">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-neutral-900">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-neutral-900">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-neutral-900">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-neutral-900">Support</h3>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li>
                <a href="mailto:support@supplier.example" className="hover:text-neutral-900">
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-neutral-900">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-neutral-900">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} Supplier. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
