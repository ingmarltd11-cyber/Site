import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getMollieClient } from '@/lib/mollie';
import { generateOrderNumber } from '@/lib/utils';
import { z } from 'zod';

const checkoutSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  vat_number: z.string().optional(),
  street: z.string().min(1),
  house_number: z.string().min(1),
  postal_code: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(2),
  shipping_street: z.string().min(1),
  shipping_house_number: z.string().min(1),
  shipping_postal_code: z.string().min(1),
  shipping_city: z.string().min(1),
  shipping_country: z.string().min(2),
  shipping_method_id: z.string().uuid(),
  discount_code: z.string().optional(),
  customer_note: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      variant_id: z.string().uuid().optional().nullable(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const supabase = await createClient();
    const service = createServiceClient();

    // Get current user (optional for guests)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch products server-side for price validation
    const productIds = data.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await service
      .from('products')
      .select('id, name, sku, price, stock, is_published, min_order_quantity')
      .in('id', productIds)
      .eq('is_published', true);

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ error: 'Products not found' }, { status: 400 });
    }

    type ProductRow = {
      id: string;
      name: string;
      sku: string | null;
      price: number;
      stock: number;
      is_published: boolean;
      min_order_quantity: number | null;
    };
    const productMap = new Map<string, ProductRow>(
      products.map((p: ProductRow) => [p.id, p])
    );

    // Validate items & calculate subtotal
    let subtotal = 0;
    const orderItems: Array<{
      product_id: string;
      variant_id: string | null;
      product_name: string;
      product_sku: string | null;
      variant_name: string | null;
      unit_price: number;
      quantity: number;
      total_price: number;
    }> = [];

    for (const item of data.items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }
      if (item.quantity < (product.min_order_quantity || 1)) {
        return NextResponse.json(
          { error: `Minimum order quantity for ${product.name} is ${product.min_order_quantity}` },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: product.id,
        variant_id: item.variant_id || null,
        product_name: product.name,
        product_sku: product.sku,
        variant_name: null,
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: totalPrice,
      });
    }

    // Shipping
    const { data: shippingMethod } = await service
      .from('shipping_methods')
      .select('*')
      .eq('id', data.shipping_method_id)
      .eq('is_active', true)
      .single();

    if (!shippingMethod) {
      return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
    }

    let shippingCost = Number(shippingMethod.price);
    if (
      shippingMethod.free_shipping_threshold &&
      subtotal >= Number(shippingMethod.free_shipping_threshold)
    ) {
      shippingCost = 0;
    }

    // Discount validation (server-side only)
    let discountAmount = 0;
    let discountCodeId: string | null = null;
    let discountCodeText: string | null = null;

    if (data.discount_code) {
      const { data: discount } = await service
        .from('discount_codes')
        .select('*')
        .eq('code', data.discount_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (discount) {
        const now = new Date();
        const validStart = !discount.starts_at || new Date(discount.starts_at) <= now;
        const validEnd = !discount.expires_at || new Date(discount.expires_at) >= now;
        const underLimit = !discount.max_uses || discount.used_count < discount.max_uses;
        const meetsMin = subtotal >= Number(discount.min_order_amount || 0);

        if (validStart && validEnd && underLimit && meetsMin) {
          if (discount.type === 'percentage') {
            discountAmount = (subtotal * Number(discount.value)) / 100;
          } else {
            discountAmount = Number(discount.value);
          }
          discountAmount = Math.min(discountAmount, subtotal);
          discountCodeId = discount.id;
          discountCodeText = discount.code;
        }
      }
    }

    const total = Math.max(0, subtotal + shippingCost - discountAmount);
    const orderNumber = generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await service
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
        company_name: data.company_name || null,
        vat_number: data.vat_number || null,
        billing_street: data.street,
        billing_house_number: data.house_number,
        billing_postal_code: data.postal_code,
        billing_city: data.city,
        billing_country: data.country,
        shipping_street: data.shipping_street,
        shipping_house_number: data.shipping_house_number,
        shipping_postal_code: data.shipping_postal_code,
        shipping_city: data.shipping_city,
        shipping_country: data.shipping_country,
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        total,
        discount_code_id: discountCodeId,
        discount_code: discountCodeText,
        payment_status: 'open',
        order_status: 'pending',
        shipping_method_id: shippingMethod.id,
        shipping_method_name: shippingMethod.name,
        customer_note: data.customer_note || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order create error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const { error: itemsError } = await service.from('order_items').insert(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      }))
    );

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Rollback order
      await service.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Create Mollie payment
    const mollie = getMollieClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: total.toFixed(2),
      },
      description: `Order ${orderNumber}`,
      redirectUrl: `${siteUrl}/checkout/success?order=${order.id}`,
      webhookUrl: `${siteUrl}/api/webhooks/mollie`,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
      },
    });

    // Store payment
    await service.from('payments').insert({
      order_id: order.id,
      mollie_payment_id: payment.id,
      amount: total,
      currency: 'EUR',
      status: 'open',
      method: payment.method || null,
      mollie_data: payment as unknown as Record<string, unknown>,
    });

    // Update discount usage if used
    if (discountCodeId) {
      await service.rpc('increment_discount_usage', { discount_id: discountCodeId }).catch(() => {
        // Fallback if RPC not exists
        service
          .from('discount_codes')
          .update({ used_count: (data as any).used_count + 1 })
          .eq('id', discountCodeId);
      });
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: orderNumber,
      payment_url: payment.getCheckoutUrl(),
      total,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.errors }, { status: 400 });
    }
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
