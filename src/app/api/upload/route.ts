import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

/**
 * POST /api/upload
 *
 * Sube una imagen al bucket público "menus" de Supabase Storage,
 * dentro de la carpeta del usuario autenticado: `menus/{userId}/...`.
 *
 * Procesamiento con sharp:
 *  - Redimensiona a máximo 1200x1200 (preservando aspect ratio)
 *  - Convierte a WebP (calidad 82) → ~50% más liviano que JPEG/PNG original
 *  - Para imágenes con alpha (PNG transparente, p.ej. resultado de "Quitar fondo"),
 *    preserva el canal alpha y usa WebP con alpha.
 *
 * Body: FormData con `file` (File) y opcional `transparent` (boolean).
 * Respuesta: { url: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const transparent = formData.get('transparent') === 'true';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Máximo 10MB por imagen' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Procesar con sharp
    let processed: Buffer;
    if (transparent) {
      // Mantener alpha (resultado de bg removal) — WebP preserva alpha por defecto
      // si el input lo tiene. Usamos lossless para mayor calidad del PNG transparente.
      processed = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90, alphaQuality: 100, effort: 4 })
        .toBuffer();
    } else {
      // Imagen normal sin transparencia → WebP opaco
      processed = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    }

    // Generar nombre único: {userId}/{timestamp}-{random}.webp
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const filename = `${user.id}/${timestamp}-${random}.webp`;

    const { error } = await supabase.storage
      .from('menus')
      .upload(filename, processed, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      console.error('[upload] Supabase error:', error);
      return NextResponse.json(
        { error: `Error al subir: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('menus')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error('[upload] sharp error:', err);
    return NextResponse.json(
      { error: 'Error procesando imagen' },
      { status: 500 }
    );
  }
}
