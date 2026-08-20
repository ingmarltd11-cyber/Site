import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const service = createServiceClient();

    // Only allow account creation if no account exists yet
    const { count, error: countError } = await service
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Registration count error:', countError);
      return NextResponse.json({ error: 'Could not verify registration status' }, { status: 500 });
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'Registration is closed. An account already exists.' },
        { status: 403 }
      );
    }

    // First account ever: create it and make it admin
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
        role: 'admin',
      },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.errors }, { status: 400 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
