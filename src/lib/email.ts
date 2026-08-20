import { Resend } from 'resend';
import { createServiceClient } from './supabase/server';
import type { EmailType, Order, OrderItem } from '@/types/database';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  return new Resend(apiKey);
}

interface EmailVariables {
  customer_name: string;
  customer_email: string;
  order_number: string;
  order_date: string;
  order_total: string;
  subtotal: string;
  shipping_cost: string;
  discount: string;
  order_items: string;
  shipping_address: string;
  tracking_number: string;
  store_name: string;
}

function replaceVariables(template: string, vars: EmailVariables): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value ?? '');
  }
  // Strip any remaining unreplaced variables for safety
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  return result;
}

function formatOrderItems(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `- ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''} x${item.quantity} — €${item.total_price.toFixed(2)}`
    )
    .join('\n');
}

function formatAddress(order: Order): string {
  return `${order.shipping_street} ${order.shipping_house_number}\n${order.shipping_postal_code} ${order.shipping_city}\n${order.shipping_country}`;
}

export async function sendOrderEmail(
  orderId: string,
  emailType: EmailType
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Prevent duplicate emails on webhook retries
  const { data: existing } = await supabase
    .from('email_logs')
    .select('id')
    .eq('order_id', orderId)
    .eq('email_type', emailType)
    .eq('status', 'sent')
    .maybeSingle();

  if (existing) {
    return { success: true }; // Already sent
  }

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('type', emailType)
    .eq('is_enabled', true)
    .single();

  if (templateError || !template) {
    return { success: false, error: `Template ${emailType} not found or disabled` };
  }

  // Get order with items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Order not found' };
  }

  // Get store name
  const { data: storeSetting } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'store_name')
    .single();

  const storeName = (storeSetting?.value as string) || 'Supplier';

  const items = (order.order_items || []) as OrderItem[];

  const vars: EmailVariables = {
    customer_name: `${order.first_name} ${order.last_name}`.trim(),
    customer_email: order.email,
    order_number: order.order_number,
    order_date: new Date(order.created_at).toLocaleDateString('nl-NL'),
    order_total: `€${Number(order.total).toFixed(2)}`,
    subtotal: `€${Number(order.subtotal).toFixed(2)}`,
    shipping_cost: `€${Number(order.shipping_cost).toFixed(2)}`,
    discount: order.discount_amount > 0 ? `-€${Number(order.discount_amount).toFixed(2)}` : '€0.00',
    order_items: formatOrderItems(items),
    shipping_address: formatAddress(order as Order),
    tracking_number: order.tracking_number || 'N/A',
    store_name: storeName.replace(/"/g, ''),
  };

  const subject = replaceVariables(template.subject, vars);
  const body = replaceVariables(template.body, vars);

  // Log as pending
  const { data: log } = await supabase
    .from('email_logs')
    .insert({
      order_id: orderId,
      recipient: order.email,
      email_type: emailType,
      subject,
      status: 'pending',
    })
    .select()
    .single();

  try {
    const resend = getResend();
    const from = process.env.EMAIL_FROM || 'Supplier <noreply@example.com>';

    const { data, error } = await resend.emails.send({
      from,
      to: order.email,
      subject,
      text: body,
    });

    if (error) {
      if (log) {
        await supabase
          .from('email_logs')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', log.id);
      }
      return { success: false, error: error.message };
    }

    if (log) {
      await supabase
        .from('email_logs')
        .update({ status: 'sent', resend_id: data?.id })
        .eq('id', log.id);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (log) {
      await supabase
        .from('email_logs')
        .update({ status: 'failed', error_message: message })
        .eq('id', log.id);
    }
    return { success: false, error: message };
  }
}
