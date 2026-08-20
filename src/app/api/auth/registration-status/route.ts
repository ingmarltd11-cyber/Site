import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const service = createServiceClient();

  const { count, error } = await service
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Registration status error:', error);
    return NextResponse.json({ error: 'Failed to check registration status' }, { status: 500 });
  }

  return NextResponse.json({ open: (count || 0) === 0 });
}
