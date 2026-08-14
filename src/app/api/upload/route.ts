import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { optimizeImage } from '@/lib/image-optimizer';
import type { ImageSize } from '@/lib/image-utils';

// Multipart/form-data → Node.js runtime (sharp needs native bindings)
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 *
 * Sube una imagen (logo / cover / foto de plato / resultado bg-removal) a Supabase Storage.
 *
 * Form data:
 *   - file:        File (required) — imagen JPEG/PNG/WebP/GIF, máx 5MB
 *   - transparent: 'true' | 'false' (optional, default false)
 *                  Si true: se sube como PNG preservando alpha (usado por bg-removal)
 *                  Si false: se optimiza a WebP multi-size (thumb/medium/large)
 *
 * Response 200:
 *   { url: string, variants?: { thumb, medium, large } }
 *
 * Response 4xx/5xx:
 *   { error: string }
 */
export async function POST(req: NextRequest) {
  console.log('[api/upload] POST start, content-type:', req.headers.get('content-type'));

  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    console.log('[api/upload] auth user:', user?.id, 'err:', authErr?.message);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parse multipart form
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr: any) {
      console.error('[api/upload] formData parse error:', formErr?.message || formErr);
      return NextResponse.json(
        { error: `Error al leer formulario: ${formErr?.message || 'unknown'}` },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const transparent = formData.get('transparent') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Falta archivo file' }, { status: 400 });
    }
    console.log('[api/upload] file:', file?.name, 'size:', file?.size, 'type:', file?.type, 'transparent:', transparent);

    // 3. Validate MIME type
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no soportado: ${file.type}. Use JPEG, PNG, WebP o GIF.` },
        { status: 400 }
      );
    }

    // 4. Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande (máx 5MB, recibido ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      );
    }

    // 5. Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // 6. Decide bucket: transparent (bg-removal result) → 'menus' bucket, normal → 'menu-images' bucket
    // Both buckets exist on Supabase prod. 'menus' is also used by /api/bg-removal/process
    // for consistency with bg-removed images.
    const bucket = transparent ? 'menus' : 'menu-images';

    // 7. Generate unique path: {userId}/{timestamp}-{random}-{...}.{ext}
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const baseName = `${user.id}/${timestamp}-${random}`;

    const serviceClient = createServiceClient();
    const uploadClient = serviceClient || supabase;

    // 8.A Transparent path: upload single PNG preserving alpha (bg-removal result)
    if (transparent) {
      // Re-encode to PNG to ensure compatibility (input may be blob from canvas.toBlob('image/png'))
      const filename = `${baseName}-bgremoved.png`;
      const { error: upErr } = await uploadClient.storage
        .from(bucket)
        .upload(filename, originalBuffer, {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: false,
        });

      if (upErr) {
        console.error('[api/upload] transparent upload error:', upErr);
        return NextResponse.json(
          { error: `Error al subir imagen: ${upErr.message}` },
          { status: 500 }
        );
      }

      const { data: urlData } = uploadClient.storage.from(bucket).getPublicUrl(filename);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        return NextResponse.json({ error: 'Error al obtener URL pública' }, { status: 500 });
      }
      console.log('[api/upload] transparent OK →', publicUrl);
      return NextResponse.json({ url: publicUrl });
    }

    // 8.B Normal path: optimize with sharp → 3 sizes (thumb/medium/large) in WebP
    let optimized;
    try {
      optimized = await optimizeImage(originalBuffer, {
        transparent: false,
        sizes: ['thumb', 'medium', 'large'] as ImageSize[],
      });
    } catch (optErr: any) {
      console.error('[api/upload] optimizeImage error:', optErr?.message || optErr);
      // Fallback: upload original as-is (no optimization)
      const ext = file.type.split('/')[1] || 'png';
      const filename = `${baseName}.${ext}`;
      const { error: upErr } = await uploadClient.storage
        .from(bucket)
        .upload(filename, originalBuffer, {
          contentType: file.type,
          cacheControl: '31536000',
          upsert: false,
        });
      if (upErr) {
        return NextResponse.json({ error: `Error al subir imagen: ${upErr.message}` }, { status: 500 });
      }
      const { data: urlData } = uploadClient.storage.from(bucket).getPublicUrl(filename);
      console.log('[api/upload] fallback OK →', urlData?.publicUrl);
      return NextResponse.json({ url: urlData?.publicUrl });
    }

    // 9. Upload all 3 variants to Supabase Storage
    const uploadedUrls: Record<string, string> = {};
    for (const variant of optimized.variants) {
      // Only upload WebP variants (skip AVIF if any to save storage)
      if (variant.format !== 'webp') continue;
      const filename = `${baseName}${variant.suffix}.webp`;
      const { error: vErr } = await uploadClient.storage
        .from(bucket)
        .upload(filename, variant.buffer, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        });
      if (vErr) {
        console.error(`[api/upload] upload error (${variant.size}):`, vErr);
        continue;
      }
      const { data: urlData } = uploadClient.storage.from(bucket).getPublicUrl(filename);
      uploadedUrls[variant.size] = urlData.publicUrl;
    }

    // 10. Fallback: if large failed but another variant exists, use that
    if (!uploadedUrls.large) {
      const anySize = Object.keys(uploadedUrls)[0];
      if (!anySize) {
        return NextResponse.json(
          { error: 'Error al subir imagen optimizada (ninguna variante se subió)' },
          { status: 500 }
        );
      }
      uploadedUrls.large = uploadedUrls[anySize];
    }

    const finalUrl = uploadedUrls.large;
    console.log('[api/upload] optimized OK →', finalUrl, '(sizes:', Object.keys(uploadedUrls).join(','), ')');

    return NextResponse.json({
      url: finalUrl,
      variants: uploadedUrls,
    });
  } catch (err: any) {
    console.error('[api/upload] unexpected error:', err?.message || err, err?.stack);
    return NextResponse.json(
      { error: `Error interno: ${err?.message || 'unknown'}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload — health check
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'upload' });
}
