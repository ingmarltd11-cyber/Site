import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') return null;
  return user;
}

export async function PUT(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, subject, body: emailBody, is_enabled } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Prevent code execution in templates — only allow safe variable placeholders
    const safeSubject = String(subject || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    const safeBody = String(emailBody || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

    const service = createServiceClient();
    const { error } = await service
      .from('email_templates')
      .update({
        subject: safeSubject,
        body: safeBody,
        is_enabled: !!is_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
