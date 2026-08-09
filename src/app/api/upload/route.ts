import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Multipart upload — Node.js runtime
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 *
 * Sube una imagen (logo, cover, foto de plato, etc.) a Supabase Storage.
 *
 * Body: multipart/form-data
 *   - file: el archivo (JPEG, PNG, WebP, GIF — máx 5MB)
 *
 * Response: { success: true, url: string, path: string }
 *
 * Usa el bucket "menu-images" (público). Si no existe, lo crea vía
 * service role client. El path incluye {userId}/{timestamp}-{random}.{ext}
 * para evitar colisiones y mantener aislamiento por usuario.
 *
 * El usuario DEBE estar autenticado. RLS en Storage permite a cada
 * usuario escribir solo en su propio prefijo.
 */
export async function POST(req: NextRequest) {
  console.log('[api/upload] POST start, content-type:', req.headers.get('content-type'));

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    console.log('[api/upload] auth user:', user?.id, 'err:', authErr?.message);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
    if (!file) {
      return NextResponse.json({ error: 'Falta archivo file' }, { status: 400 });
    }

    console.log('[api/upload] file:', file.name, 'size:', file.size, 'type:', file.type);

    // Validar tipo MIME
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no soportado: ${file.type}. Use JPEG, PNG, WebP o GIF.` },
        { status: 400 }
      );
    }

    // Validar tamaño (máx 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande (máx 5MB, recibido ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      );
    }

    // Generar nombre único: {userId}/{timestamp}-{random}.{ext}
    const ext = file.type.split('/')[1] || 'png';
    const random = Math.random().toString(36).substring(2, 10);
    const fileName = `${user.id}/${Date.now()}-${random}.${ext}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Asegurar que el bucket existe (usando service client si está disponible)
    const BUCKET_NAME = 'menu-images';
    const serviceClient = createServiceClient();
    if (serviceClient) {
      try {
        const { data: bucketData } = await serviceClient.storage.getBucket(BUCKET_NAME);
        if (!bucketData) {
          await serviceClient.storage.createBucket(BUCKET_NAME, {
            public: true,
            allowedMimeTypes: ALLOWED_TYPES,
            fileSizeLimit: MAX_SIZE,
          });
          console.log(`[api/upload] Bucket "${BUCKET_NAME}" creado`);
        }
      } catch (bucketErr: any) {
        if (!bucketErr.message?.includes('already exists')) {
          console.warn('[api/upload] bucket check:', bucketErr.message);
        }
      }
    }

    // Subir archivo a Supabase Storage
    // Preferimos service client (bypassa RLS) si está disponible; si no, caemos al
    // cliente normal (que respeta RLS — requiere policies de escritura en el bucket).
    const uploadClient = serviceClient || supabase;
    const { data: uploadData, error: uploadError } = await uploadClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[api/upload] upload error:', uploadError);
      return NextResponse.json(
        { error: `Error al subir imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: urlData } = uploadClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.error('[api/upload] no public URL returned');
      return NextResponse.json(
        { error: 'Error al obtener URL pública' },
        { status: 500 }
      );
    }

    console.log('[api/upload] success:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData?.path || fileName,
    });
  } catch (err) {
    console.error('[api/upload] unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
