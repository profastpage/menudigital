import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/plans';

// POST /api/upload — sube imagen a Supabase Storage
// Recibe: multipart/form-data con campo "file"
// Retorna: { url: string }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Obtener plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = PLANS[profile?.plan || 'free'];

  // Contar imágenes actuales del usuario
  // Para simplificar, contamos archivos en storage del usuario
  const { data: userFiles } = await supabase.storage
    .from('menus')
    .list(user.id, { limit: 1000 });

  const currentCount = userFiles?.length || 0;

  if (currentCount >= plan.limits.maxImages) {
    return NextResponse.json(
      {
        error: `Límite de imágenes alcanzado (${plan.limits.maxImages}). ${
          plan.id === 'free' ? 'Upgrade a Pro para más imágenes.' : ''
        }`,
      },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
  }

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 });
  }

  // Validar tamaño (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Máximo 5MB por imagen' }, { status: 400 });
  }

  // Generar path único: userId/randomname.ext
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
  const path = `${user.id}/${filename}`;

  const { error: uploadErr } = await supabase.storage
    .from('menus')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // Obtener URL pública
  const { data: publicUrlData } = supabase.storage
    .from('menus')
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
