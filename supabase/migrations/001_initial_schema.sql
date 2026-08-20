-- Supplier E-commerce Platform - Initial Schema
-- Run this in Supabase SQL Editor or via CLI

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company_name TEXT,
  vat_number TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  sku TEXT UNIQUE,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= 0),
  cost_price DECIMAL(10,2) CHECK (cost_price >= 0), -- Supplier cost - NEVER expose to customers
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_order_quantity INTEGER DEFAULT 1 CHECK (min_order_quantity >= 1),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  badge TEXT, -- e.g. "New", "Sale", "Best Seller"
  
  -- Supplier specific fields (admin only)
  supplier_name TEXT,
  supplier_sku TEXT,
  supplier_product_id TEXT,
  
  weight DECIMAL(8,2),
  meta_title TEXT,
  meta_description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_published ON public.products(is_published);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON public.product_images(product_id);

-- =====================================================
-- PRODUCT VARIANTS
-- =====================================================
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Size", "Color"
  value TEXT NOT NULL, -- e.g. "Large", "Red"
  sku TEXT,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);

-- =====================================================
-- DISCOUNT CODES
-- =====================================================
CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);

-- =====================================================
-- SHIPPING METHODS
-- =====================================================
CREATE TABLE public.shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  free_shipping_threshold DECIMAL(10,2),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  countries TEXT[] DEFAULT ARRAY['NL', 'BE', 'DE'], -- ISO country codes
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ORDERS
-- =====================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Customer info (snapshot at time of order)
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  vat_number TEXT,
  
  -- Billing address
  billing_street TEXT NOT NULL,
  billing_house_number TEXT NOT NULL,
  billing_postal_code TEXT NOT NULL,
  billing_city TEXT NOT NULL,
  billing_country TEXT NOT NULL DEFAULT 'NL',
  
  -- Shipping address
  shipping_street TEXT NOT NULL,
  shipping_house_number TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'NL',
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Discount
  discount_code_id UUID REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  discount_code TEXT,
  
  -- Status
  payment_status TEXT NOT NULL DEFAULT 'open' 
    CHECK (payment_status IN ('open', 'pending', 'paid', 'failed', 'canceled', 'expired', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (order_status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')),
  
  -- Tracking
  tracking_number TEXT,
  shipping_method_id UUID REFERENCES public.shipping_methods(id) ON DELETE SET NULL,
  shipping_method_name TEXT,
  
  -- Notes
  customer_note TEXT,
  admin_note TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_email ON public.orders(email);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_order_status ON public.orders(order_status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- =====================================================
-- ORDER ITEMS
-- =====================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot of product at time of purchase
  product_name TEXT NOT NULL,
  product_sku TEXT,
  variant_name TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- =====================================================
-- PAYMENTS (Mollie)
-- =====================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  mollie_payment_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'paid', 'failed', 'canceled', 'expired', 'refunded')),
  method TEXT,
  mollie_data JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_mollie_id ON public.payments(mollie_payment_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- =====================================================
-- EMAIL TEMPLATES
-- =====================================================
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL UNIQUE 
    CHECK (type IN (
      'order_confirmation',
      'payment_received',
      'order_processing',
      'order_shipped',
      'order_completed',
      'payment_failed',
      'order_cancelled',
      'refund'
    )),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- EMAIL LOGS
-- =====================================================
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  resend_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_order ON public.email_logs(order_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);

-- =====================================================
-- STORE SETTINGS
-- =====================================================
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CART (for logged-in users - guests use localStorage)
-- =====================================================
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_methods_updated_at BEFORE UPDATE ON public.shipping_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO CREATE PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ORDER NUMBER GENERATOR
-- =====================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DEFAULT EMAIL TEMPLATES
-- =====================================================
INSERT INTO public.email_templates (type, name, subject, body, is_enabled) VALUES
(
  'order_confirmation',
  'Order Confirmation',
  'Your order #{{order_number}} has been confirmed',
  E'Hey {{customer_name}},\n\nThank you for your order at {{store_name}}.\n\nOrder number: {{order_number}}\nOrder date: {{order_date}}\n\n{{order_items}}\n\nSubtotal: {{subtotal}}\nShipping: {{shipping_cost}}\nDiscount: {{discount}}\nTotal: {{order_total}}\n\nShipping address:\n{{shipping_address}}\n\nThanks,\n{{store_name}}',
  true
),
(
  'payment_received',
  'Payment Received',
  'Payment received for order #{{order_number}}',
  E'Hey {{customer_name}},\n\nWe have received your payment for order #{{order_number}}.\n\nTotal paid: {{order_total}}\n\nWe will start processing your order shortly.\n\nThanks,\n{{store_name}}',
  true
),
(
  'order_processing',
  'Order Processing',
  'Your order #{{order_number}} is being processed',
  E'Hey {{customer_name}},\n\nYour order #{{order_number}} is now being processed.\n\nWe will notify you once it has been shipped.\n\nThanks,\n{{store_name}}',
  true
),
(
  'order_shipped',
  'Order Shipped',
  'Your order #{{order_number}} has been shipped',
  E'Hey {{customer_name}},\n\nGreat news! Your order #{{order_number}} has been shipped.\n\nTracking number: {{tracking_number}}\n\nThanks,\n{{store_name}}',
  true
),
(
  'order_completed',
  'Order Completed',
  'Your order #{{order_number}} is complete',
  E'Hey {{customer_name}},\n\nYour order #{{order_number}} has been completed.\n\nThank you for shopping with us!\n\nThanks,\n{{store_name}}',
  true
),
(
  'payment_failed',
  'Payment Failed',
  'Payment failed for order #{{order_number}}',
  E'Hey {{customer_name}},\n\nUnfortunately the payment for order #{{order_number}} has failed.\n\nPlease try again or contact support.\n\nThanks,\n{{store_name}}',
  true
),
(
  'order_cancelled',
  'Order Cancelled',
  'Your order #{{order_number}} has been cancelled',
  E'Hey {{customer_name}},\n\nYour order #{{order_number}} has been cancelled.\n\nIf you have any questions, please contact us.\n\nThanks,\n{{store_name}}',
  true
),
(
  'refund',
  'Refund Processed',
  'Refund for order #{{order_number}}',
  E'Hey {{customer_name}},\n\nA refund has been processed for order #{{order_number}}.\n\nAmount: {{order_total}}\n\nThanks,\n{{store_name}}',
  true
);

-- =====================================================
-- SEED DEFAULT STORE SETTINGS
-- =====================================================
INSERT INTO public.store_settings (key, value) VALUES
('store_name', '"Supplier"'),
('store_email', '"info@supplier.example"'),
('support_email', '"support@supplier.example"'),
('currency', '"EUR"'),
('store_description', '"Premium supplier of quality products"'),
('logo_url', 'null'),
('free_shipping_threshold', '100'),
('default_shipping_price', '6.95');

-- =====================================================
-- SEED DEFAULT SHIPPING METHOD
-- =====================================================
INSERT INTO public.shipping_methods (name, description, price, free_shipping_threshold, estimated_days_min, estimated_days_max, countries, is_active)
VALUES (
  'Standard Shipping',
  'Delivery within 2-5 business days',
  6.95,
  100.00,
  2,
  5,
  ARRAY['NL', 'BE', 'DE', 'FR', 'LU'],
  true
);
