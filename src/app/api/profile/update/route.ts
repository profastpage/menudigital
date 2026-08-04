import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * PATCH /api/profile/update
 *
 * Actualiza datos del negocio y del perfil del usuario autenticado.
 * Campos permitidos (todos opcionales, solo se actualizan los que vienen):
 *
 *   - fullName
 *   - businessName, businessLegalName, businessTaxId
 *   - businessPhone, businessWhatsapp
 *   - businessAddress, businessCity, businessCountry, businessPostalCode
 *   - businessDescription, businessWebsite
 *   - socialFacebook, socialInstagram, socialTiktok, socialYoutube, socialX
 *   - businessHours (JSON), businessTimezone
 *   - billingEmail, billingAddress
 *   - logoUrl, photoUrl (si se subieron antes vía /api/profile/upload-image)
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIP(req);
  const limited = rateLimitResponse(`profile-update:${ip}`, RATE_LIMITS.default);
  if (limited) return limited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    const ALLOWED: Record<string, string> = {
      fullName: 'full_name',
      businessName: 'business_name',
      businessLegalName: 'business_legal_name',
      businessTaxId: 'business_tax_id',
      businessPhone: 'business_phone',
      businessWhatsapp: 'business_whatsapp',
      businessAddress: 'business_address',
      businessCity: 'business_city',
      businessCountry: 'business_country',
      businessPostalCode: 'business_postal_code',
      businessDescription: 'business_description',
      businessWebsite: 'business_website',
      logoUrl: 'logo_url',
      photoUrl: 'photo_url',
      socialFacebook: 'social_facebook',
      socialInstagram: 'social_instagram',
      socialTiktok: 'social_tiktok',
      socialYoutube: 'social_youtube',
      socialX: 'social_x',
      businessHours: 'business_hours',
      businessTimezone: 'business_timezone',
      billingEmail: 'billing_email',
      billingAddress: 'billing_address',
    };

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    let updatedCount = 0;

    for (const [bodyKey, dbKey] of Object.entries(ALLOWED)) {
      if (bodyKey in body) {
        const value = body[bodyKey];
        if (value === null || value === undefined || value === '') {
          update[dbKey] = null;
          updatedCount++;
        } else if (typeof value === 'string') {
          if (value.length > 500) {
            return NextResponse.json(
              { error: `Campo ${bodyKey} demasiado largo (máx 500 caracteres)` },
              { status: 400 }
            );
          }
          update[dbKey] = value.trim();
          updatedCount++;
        } else if (dbKey === 'business_hours' && typeof value === 'object') {
          update[dbKey] = value;
          updatedCount++;
        } else {
          return NextResponse.json(
            { error: `Campo ${bodyKey} con tipo no soportado` },
            { status: 400 }
          );
        }
      }
    }

    if (updatedCount === 0) {
      return NextResponse.json(
        { error: 'No se recibió ningún campo para actualizar' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id);

    if (error) {
      console.error('[api/profile/update] DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated_fields: updatedCount,
    });
  } catch (err) {
    console.error('[api/profile/update] unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * GET /api/profile/me
 * Retorna el perfil completo del usuario autenticado usando la RPC get_my_full_profile().
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('get_my_full_profile');

    if (error) {
      console.error('[api/profile/update] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[api/profile/update] GET unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
