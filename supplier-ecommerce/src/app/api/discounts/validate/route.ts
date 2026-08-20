import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = schema.parse(body);

    const supabase = createServiceClient();

    const { data: discount, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 });
    }

    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json({ error: 'This code is not active yet' }, { status: 400 });
    }
    if (discount.expires_at && new Date(discount.expires_at) < now) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
    }
    if (discount.max_uses && discount.used_count >= discount.max_uses) {
      return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 });
    }
    if (subtotal < Number(discount.min_order_amount || 0)) {
      return NextResponse.json(
        { error: `Minimum order amount is €${Number(discount.min_order_amount).toFixed(2)}` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * Number(discount.value)) / 100;
    } else {
      discountAmount = Number(discount.value);
    }
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({
      valid: true,
      discount_amount: discountAmount,
      type: discount.type,
      value: discount.value,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
