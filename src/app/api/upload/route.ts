import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { optimizeImage } from '@/lib/image-optimizer';

/**
 * POST /api/upload
 *
 * Sube una imagen al bucket público "menus" de Supabase Storage,
 * dentro de la carpeta del usuario autenticado: `menus/{userId}/...`.
 *
 * Pipeline profesional de optimización (ver src/lib/image-optimizer.ts):
 *  ─ Redimensiona a 3 tamaños responsivos: 400px (thumb), 800px (medium), 1200px (large)
 *  ─ Convierte todo a WebP (calidad adaptativa: 72/78/82)
 *  ─ Strip de EXIF/metadata (privacidad + ahorro ~50KB)
 *  ─ Auto-rotate según EXIF orientation
 *  ─ Preserva alpha (PNG transparente, resultado de "Quitar fondo")
 *  ─ Cache-Control: 1 año (inmutable)
 *
 * Body: FormData con `file` (File) y opcional `transparent` (boolean).
 *
 * Respuesta:
 *   {
 *     url: string,            // URL del "large" (1200w) — para compat con código existente
 *     thumb: string,          // URL del thumb (400w) — para grids
 *     medium: string,         // URL del medium (800w)
 *     large: string,          // Igual que `url`
 *     variants: { thumb, medium, large },
 *     metadata: { originalBytes, optimizedBytes, savingsPct, width, height }
 *   }
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

  // 15MB límite (subimos el límite porque el original puede ser pesado, pero el optimizado será mucho más liviano)
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'Máximo 15MB por imagen' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // ─── Optimizar imagen (multi-size WebP) ───
    const result = await optimizeImage(buffer, { transparent });

    if (result.variants.length === 0) {
      throw new Error('No se pudo optimizar la imagen');
    }

    // ─── Subir todas las variantes a Supabase Storage ───
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const baseName = `${user.id}/${timestamp}-${random}`;

    const uploadedUrls: Record<string, string> = {};
    const uploadErrors: string[] = [];

    for (const variant of result.variants) {
      const filename = `${baseName}${variant.suffix}.webp`;
      const { error } = await supabase.storage
        .from('menus')
        .upload(filename, variant.buffer, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 año — las imágenes son inmutables
          upsert: false,
        });

      if (error) {
        console.error(`[upload] Supabase error (${variant.size}):`, error);
        uploadErrors.push(`${variant.size}: ${error.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('menus')
        .getPublicUrl(filename);

      uploadedUrls[variant.size] = publicUrlData.publicUrl;
    }

    // Verificar que al menos el "large" se subió
    if (!uploadedUrls.large) {
      // Fallback: si falló el large pero hay otro, usarlo
      const anySize = Object.keys(uploadedUrls)[0];
      if (!anySize) {
        return NextResponse.json(
          { error: `Error al subir imágenes: ${uploadErrors.join('; ')}` },
          { status: 500 }
        );
      }
      uploadedUrls.large = uploadedUrls[anySize];
    }

    // ─── Construir respuesta ───
    const response: Record<string, unknown> = {
      url: uploadedUrls.large, // compat con código existente
      thumb: uploadedUrls.thumb || uploadedUrls.large,
      medium: uploadedUrls.medium || uploadedUrls.large,
      large: uploadedUrls.large,
      variants: {
        thumb: uploadedUrls.thumb || uploadedUrls.large,
        medium: uploadedUrls.medium || uploadedUrls.large,
        large: uploadedUrls.large,
      },
      metadata: {
        originalBytes: result.metadata.originalBytes,
        optimizedBytes: result.metadata.optimizedBytes,
        savingsPct: result.metadata.savingsPct,
        width: result.metadata.originalWidth,
        height: result.metadata.originalHeight,
        hasAlpha: result.metadata.hasAlpha,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[upload] optimization error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error procesando imagen' },
      { status: 500 }
    );
  }
}
