-- Row Level Security Policies
-- Critical for security

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PROFILES
-- =====================================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevent role escalation
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- =====================================================
-- CATEGORIES (public read for active, admin full access)
-- =====================================================
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- PRODUCTS (public read for published, admin full)
-- NEVER expose cost_price, supplier_* to customers
-- =====================================================
CREATE POLICY "Anyone can view published products"
  ON public.products FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND (p.is_published = true OR public.is_admin())
    )
  );

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- =====================================================
-- PRODUCT VARIANTS
-- =====================================================
CREATE POLICY "Anyone can view active variants of published products"
  ON public.product_variants FOR SELECT
  USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND (p.is_published = true OR public.is_admin())
    )
  );

CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin());

-- =====================================================
-- DISCOUNT CODES (admin only for management, validation via server)
-- =====================================================
CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes FOR ALL
  USING (public.is_admin());

-- Allow reading active codes for validation (server-side will use service role preferably)
CREATE POLICY "Anyone can read active discount codes"
  ON public.discount_codes FOR SELECT
  USING (is_active = true);

-- =====================================================
-- SHIPPING METHODS
-- =====================================================
CREATE POLICY "Anyone can view active shipping methods"
  ON public.shipping_methods FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage shipping methods"
  ON public.shipping_methods FOR ALL
  USING (public.is_admin());

-- =====================================================
-- ORDERS
-- Customers can only see their own orders
-- Admins can see all
-- =====================================================
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL -- Allow guest orders
  );

-- Only admins or system (service role) can update orders
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- ORDER ITEMS
-- =====================================================
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL OR public.is_admin())
    )
  );

CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  USING (public.is_admin());

-- =====================================================
-- PAYMENTS
-- =====================================================
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Payments are created/updated via service role (server-side only)
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.is_admin());

-- =====================================================
-- EMAIL TEMPLATES (admin only)
-- =====================================================
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (public.is_admin());

-- =====================================================
-- EMAIL LOGS (admin only)
-- =====================================================
CREATE POLICY "Admins can view email logs"
  ON public.email_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- STORE SETTINGS
-- Public can read some settings, admin can manage all
-- =====================================================
CREATE POLICY "Anyone can read public store settings"
  ON public.store_settings FOR SELECT
  USING (
    key IN ('store_name', 'store_description', 'currency', 'logo_url', 'free_shipping_threshold')
    OR public.is_admin()
  );

CREATE POLICY "Admins can manage store settings"
  ON public.store_settings FOR ALL
  USING (public.is_admin());

-- =====================================================
-- CARTS
-- =====================================================
CREATE POLICY "Users can manage own cart"
  ON public.carts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_id AND c.user_id = auth.uid()
    )
  );
