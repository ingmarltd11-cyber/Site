export type UserRole = 'customer' | 'admin';

export type PaymentStatus = 'open' | 'pending' | 'paid' | 'failed' | 'canceled' | 'expired' | 'refunded';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
export type DiscountType = 'percentage' | 'fixed';
export type EmailType = 
  | 'order_confirmation'
  | 'payment_received'
  | 'order_processing'
  | 'order_shipped'
  | 'order_completed'
  | 'payment_failed'
  | 'order_cancelled'
  | 'refund';
export type EmailStatus = 'pending' | 'sent' | 'failed';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  vat_number: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null; // Admin only
  stock: number;
  min_order_quantity: number;
  category_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  badge: string | null;
  supplier_name: string | null; // Admin only
  supplier_sku: string | null; // Admin only
  supplier_product_id: string | null; // Admin only
  weight: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  sku: string | null;
  price_adjustment: number;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  free_shipping_threshold: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  countries: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company_name: string | null;
  vat_number: string | null;
  billing_street: string;
  billing_house_number: string;
  billing_postal_code: string;
  billing_city: string;
  billing_country: string;
  shipping_street: string;
  shipping_house_number: string;
  shipping_postal_code: string;
  shipping_city: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  discount_code_id: string | null;
  discount_code: string | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  tracking_number: string | null;
  shipping_method_id: string | null;
  shipping_method_name: string | null;
  customer_note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  mollie_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  mollie_data: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  type: EmailType;
  name: string;
  subject: string;
  body: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  order_id: string | null;
  recipient: string;
  email_type: string;
  subject: string;
  status: EmailStatus;
  error_message: string | null;
  resend_id: string | null;
  created_at: string;
}

export interface StoreSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

// Cart types (client-side + DB)
export interface CartItem {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  // Enriched on client
  product?: Product;
  variant?: ProductVariant;
}

export interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  vat_number?: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string;
  shipping_same_as_billing: boolean;
  shipping_street?: string;
  shipping_house_number?: string;
  shipping_postal_code?: string;
  shipping_city?: string;
  shipping_country?: string;
  discount_code?: string;
  customer_note?: string;
  shipping_method_id: string;
}

// Public product (without sensitive fields)
export type PublicProduct = Omit<Product, 'cost_price' | 'supplier_name' | 'supplier_sku' | 'supplier_product_id'>;
