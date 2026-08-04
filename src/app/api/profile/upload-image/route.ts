import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Esta ruta maneja subida de archivos (multipart/form-data) → debe correr en Node.js runtime
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/profile/upload-image
 *
 * Sube una imagen (foto de perfil o logo del negocio) a Supabase Storage.
 */
export async function POST(req: NextRequest) {
  console.log('[upload-image] POST start, content-type:', req.headers.get('content-type'));

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    console.log('[upload-image] auth user:', user?.id, 'err:', authErr?.message);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr: any) {
      console.error('[upload-image] formData parse error:', formErr?.message || formErr);
      return NextResponse.json(
        { error: `Error al leer formulario: ${formErr?.message || 'unknown'}` },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'photo';
    console.log('[upload-image] file:', file?.name, 'size:', file?.size, 'type:', type);

    if (!file) {
      return NextResponse.json({ error: 'Falta archivo file' }, { status: 400 });
    }

    if (type !== 'photo' && type !== 'logo') {
      return NextResponse.json(
        { error: 'type debe ser "photo" o "logo"' },
        { status: 400 }
      );
    }

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

    // Generar nombre único: {userId}/{type}-{timestamp}-{random}.{ext}
    const ext = file.type.split('/')[1] || 'png';
    const random = Math.random().toString(36).substring(2, 10);
    const fileName = `${user.id}/${type}-${Date.now()}-${random}.${ext}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Asegurar que el bucket existe (usando service client si está disponible)
    const serviceClient = createServiceClient();
    if (serviceClient) {
      try {
        const { data: bucketData } = await serviceClient.storage.getBucket('profiles');
        if (!bucketData) {
          await serviceClient.storage.createBucket('profiles', {
            public: true,
            allowedMimeTypes: ALLOWED_TYPES,
            fileSizeLimit: MAX_SIZE,
          });
          console.log('[api/profile/upload-image] Bucket "profiles" creado');
        }
      } catch (bucketErr: any) {
        // Si el bucket ya existe o no hay permisos, continuar
        if (!bucketErr.message?.includes('already exists')) {
          console.warn('[api/profile/upload-image] bucket check:', bucketErr.message);
        }
      }
    }

    // Subir archivo a Supabase Storage
    const uploadClient = serviceClient || supabase;
    const { data: uploadData, error: uploadError } = await uploadClient.storage
      .from('profiles')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[api/profile/upload-image] upload error:', uploadError);
      return NextResponse.json(
        { error: `Error al subir imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: urlData } = uploadClient.storage
      .from('profiles')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.error('[api/profile/upload-image] no public URL returned');
      return NextResponse.json(
        { error: 'Error al obtener URL pública' },
        { status: 500 }
      );
    }

    // Actualizar la columna correspondiente en profiles
    const dbField = type === 'photo' ? 'photo_url' : 'logo_url';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [dbField]: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('[api/profile/upload-image] DB update error:', updateError);
      // No es fatal: la imagen ya se subió, solo no se actualizó la URL en DB
      return NextResponse.json({
        success: true,
        url: publicUrl,
        warning: 'Imagen subida pero no se pudo actualizar perfil',
      });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type,
      field: dbField,
    });
  } catch (err) {
    console.error('[api/profile/upload-image] unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
