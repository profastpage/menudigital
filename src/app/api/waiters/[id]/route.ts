import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.full_name !== undefined) update.full_name = body.full_name;
  if (body.document_id !== undefined) update.document_id = body.document_id;
  if (body.phone !== undefined) update.phone = body.phone;
  if (body.pin !== undefined) update.pin = body.pin;
  if (body.is_active !== undefined) update.is_active = body.is_active;
  // Password management:
  //  - body.password = string → set new password
  //  - body.password = null/'' → clear password (panel vuelve a ser público)
  //  - body.password === undefined → no tocar la password existente
  if (body.password !== undefined) {
    update.password = typeof body.password === 'string' && body.password.length > 0
      ? body.password
      : null;
  }
  // Reset password: generate a random 6-char alphanumeric
  if (body.reset_password === true) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pwd = '';
    const buf = randomBytes(6);
    for (let i = 0; i < 6; i++) {
      pwd += chars[buf[i] % chars.length];
    }
    update.password = pwd;
  }

  // Regenerar qr_token: el cliente pasa { regenerate_qr: true }
  if (body.regenerate_qr === true) {
    // 32 bytes hex = 64 chars — suficiente entropía para QR token
    update.qr_token = randomBytes(24).toString('hex');
  }

  const { data, error } = await supabase
    .from('waiters')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Mozo no encontrado' }, { status: 404 });
  return NextResponse.json({ waiter: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from('waiters')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
