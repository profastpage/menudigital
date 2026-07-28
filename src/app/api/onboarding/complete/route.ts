import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canCreateMenu } from '@/lib/plans';

/**
 * POST /api/onboarding/complete
 *
 * Recibe los datos del wizard de onboarding (3 pasos):
 * 1. Datos del negocio (businessName, phone, businessType)
 * 2. Datos del menú (name, slogan, whatsapp, currency, color)
 * 3. Primer plato (categoryId, categoryName, dishName, dishPrice, dishDescription)
 *
 * Crea el menú, la categoría, el plato, marca onboarding_completed_at
 * y devuelve el menuId para redirigir al editor.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, plan, onboarding_completed_at')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile no encontrado' }, { status: 404 });
  }

  // Si ya completó onboarding, no permitir re-ejecutar
  if (profile.onboarding_completed_at) {
    return NextResponse.json({
      error: 'Onboarding ya completado',
      message: 'Ya creaste tu primer menú. Usa el editor para crear más.',
    }, { status: 409 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const {
    businessName,
    phone,
    businessType,
    menuName,
    menuSlogan,
    whatsapp,
    currency = 'S/',
    color = '#ff6b35',
    categoryName,
    dishName,
    dishPrice,
    dishDescription,
  } = body;

  // Validaciones mínimas
  if (!businessName || !menuName || !whatsapp || !categoryName || !dishName || dishPrice == null) {
    return NextResponse.json({
      error: 'Faltan campos obligatorios',
      required: ['businessName', 'menuName', 'whatsapp', 'categoryName', 'dishName', 'dishPrice'],
    }, { status: 422 });
  }

  // Verificar límite de plan (puede crear menú)
  const { count: menusCount } = await supabase
    .from('menus')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Plan Free solo permite 1 menú
  if ((menusCount || 0) >= 1 && profile.plan === 'free') {
    return NextResponse.json({
      error: 'Alcanzaste el límite de menús de tu plan',
      message: 'Tu plan Free permite 1 menú. Mejora a Pro para crear más.',
    }, { status: 403 });
  }

  // Generar slug único basado en el nombre del menú
  const baseSlug = menuName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || `menu-${Date.now()}`;

  // Verificar unicidad del slug
  const { data: existingMenu } = await supabase
    .from('menus')
    .select('id')
    .eq('user_id', user.id)
    .eq('slug', baseSlug)
    .maybeSingle();

  const slug = existingMenu ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` : baseSlug;

  // 1. Crear menú
  const { data: menu, error: menuErr } = await supabase
    .from('menus')
    .insert({
      user_id: user.id,
      name: menuName,
      slug,
      slogan: menuSlogan || null,
      whatsapp,
      currency,
      color,
      is_published: false,
    })
    .select('id, slug')
    .single();

  if (menuErr || !menu) {
    console.error('[onboarding] Error creando menú:', menuErr);
    return NextResponse.json({ error: 'No se pudo crear el menú' }, { status: 500 });
  }

  // 2. Crear primera categoría
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .insert({
      menu_id: menu.id,
      name: categoryName,
      sort_order: 0,
    })
    .select('id')
    .single();

  if (catErr || !category) {
    console.error('[onboarding] Error creando categoría:', catErr);
    await supabase.from('menus').delete().eq('id', menu.id);
    return NextResponse.json({ error: 'No se pudo crear la categoría' }, { status: 500 });
  }

  // 3. Crear primer plato
  const { error: dishErr } = await supabase
    .from('dishes')
    .insert({
      category_id: category.id,
      name: dishName,
      description: dishDescription || null,
      price: Number(dishPrice),
      sort_order: 0,
      is_available: true,
    });

  if (dishErr) {
    console.error('[onboarding] Error creando plato:', dishErr);
  }

  // 4. Actualizar profile con datos del negocio y marcar onboarding completo
  const { error: updErr } = await supabase
    .from('profiles')
    .update({
      business_name: businessName,
      phone: phone || null,
      business_type: businessType || null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updErr) {
    console.warn('[onboarding] No se pudo actualizar profile:', updErr);
  }

  return NextResponse.json({
    success: true,
    menuId: menu.id,
    slug: menu.slug,
    redirect: `/dashboard/${menu.id}?onboarded=1`,
  });
}
