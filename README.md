# Supplier — Premium Supplier E-commerce Platform

Complete production-ready supplier/reseller e-commerce platform built from scratch.

**Stack:** Next.js (App Router) + TypeScript · Supabase · Mollie · Resend · Tailwind CSS

---

## Features

### Customer storefront
- Homepage with hero, benefits, categories
- Product catalogue with search, filters, sorting, pagination
- Product detail (gallery, variants, quantity, add to cart / buy now)
- Persistent cart (localStorage)
- Full checkout (address, company/VAT, shipping, discount codes)
- Mollie payments (server-side create + webhook verify)
- Auth: register, login, logout, forgot password
- Account: profile, order history, order detail

### Admin dashboard (`/admin`)
- Dashboard (revenue, orders, customers, low stock)
- Products CRUD (incl. cost price, supplier fields)
- Categories CRUD
- Orders list + detail (status change, tracking, auto emails)
- Customers list
- Discount codes
- Editable email templates + email logs
- Shipping methods
- Store settings

### Security
- Supabase RLS on all tables
- Cost price & supplier data never exposed to customers
- Server-side price / discount / stock validation
- Mollie keys & Resend keys server-only
- Admin routes protected by middleware + role check

---

## Setup

```bash
cd supplier-ecommerce
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MOLLIE_API_KEY=test_...
RESEND_API_KEY=re_...
EMAIL_FROM=Supplier <noreply@yourdomain.com>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database

In Supabase SQL Editor, run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

### Admin user

1. Register at `/auth/register`
2. In Supabase → Table Editor → `profiles` → set `role = 'admin'`

### Run

```bash
npm run dev
```

Open http://localhost:3000  
Admin: http://localhost:3000/admin

---

## Payment flow

```
Checkout → POST /api/orders/create
  → validate prices/stock server-side
  → create order + items in Supabase
  → create Mollie payment
  → redirect customer to Mollie
  → Mollie webhook → /api/webhooks/mollie
  → fetch real status from Mollie
  → update payment + order
  → decrease stock
  → send confirmation emails (Resend)
```

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── products/             # Catalogue + detail
│   ├── cart/  checkout/      # Cart + checkout + success
│   ├── account/              # Profile + orders
│   ├── auth/                 # Login, register, forgot password
│   ├── admin/                # Full admin dashboard
│   └── api/
│       ├── orders/create/    # Create order + Mollie payment
│       ├── webhooks/mollie/  # Payment webhook
│       ├── discounts/        # Validate codes
│       ├── shipping/         # List methods
│       └── admin/            # Admin CRUD APIs
├── components/
├── hooks/use-cart.tsx
├── lib/                      # Supabase, Mollie, email, utils
└── types/database.ts
```

Built from scratch. No Shopify. No Stripe.
