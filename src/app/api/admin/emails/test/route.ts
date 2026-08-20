import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') return null;
  return { user, email: profile.email };
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    const service = createServiceClient();
    const { data: template } = await service
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM || 'Supplier <noreply@example.com>';

    // Replace variables with sample data for test
    let subject = template.subject;
    let body = template.body;
    const sample: Record<string, string> = {
      customer_name: 'Test Customer',
      customer_email: admin.email,
      order_number: 'ORD-TEST-0001',
      order_date: new Date().toLocaleDateString('nl-NL'),
      order_total: '€99.00',
      subtotal: '€89.00',
      shipping_cost: '€6.95',
      discount: '€0.00',
      order_items: '- Sample Product x1 — €89.00',
      shipping_address: 'Teststraat 1\n1234 AB Amsterdam\nNL',
      tracking_number: '3STEST123456',
      store_name: 'Supplier',
    };
    for (const [k, v] of Object.entries(sample)) {
      subject = subject.replace(new RegExp(`{{${k}}}`, 'g'), v);
      body = body.replace(new RegExp(`{{${k}}}`, 'g'), v);
    }

    const { error } = await resend.emails.send({
      from,
      to: admin.email,
      subject: `[TEST] ${subject}`,
      text: body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
