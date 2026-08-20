import Link from 'next/link';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Tag,
  Mail,
  ScrollText,
  Truck,
  Settings,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag },
  { href: '/admin/emails', label: 'Emails', icon: Mail },
  { href: '/admin/email-logs', label: 'Email logs', icon: ScrollText },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-sm font-bold text-white font-display">
            S
          </div>
          <span className="font-semibold text-neutral-900 font-display">Admin</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          >
            ← Back to store
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-4 border-b border-neutral-200 bg-white px-4 lg:hidden">
        <span className="font-semibold">Admin</span>
        <nav className="flex gap-3 overflow-x-auto text-sm">
          {nav.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 text-neutral-600">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 lg:pl-64">
        <div className="px-4 py-6 pt-20 lg:px-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
