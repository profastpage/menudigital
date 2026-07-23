import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/menus/[id] — obtiene menu completo con categorias y platos
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;

  const { data: menu, error } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !menu) {
    return NextResponse.json({ error: 'Menú no encontrado' }, { status: 404 });
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('menu_id', id)
    .order('sort_order', { ascending: true });

  const categoriesWithDishes = await Promise.all(
    (categories || []).map(async (cat) => {
      const { data: dishes } = await supabase
        .from('dishes')
        .select('*')
        .eq('category_id', cat.id)
        .order('sort_order', { ascending: true });
      return { ...cat, dishes: dishes || [] };
    })
  );

  return NextResponse.json({ menu: { ...menu, categories: categoriesWithDishes } });
}

// PUT /api/menus/[id] — actualiza menu completo (con categorias y platos anidados)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;

  // Verificar ownership
  const { data: existing } = await supabase
    .from('menus')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Menú no encontrado' }, { status: 404 });
  }

  const body = await req.json();
  const {
    name,
    slogan,
    description,
    whatsapp,
    logo_url,
    color,
    currency,
    branding_text,
    is_published,
    categories,
  } = body;

  // Actualizar menu
  const { error: menuErr } = await supabase
    .from('menus')
    .update({
      name: name?.trim(),
      slogan: slogan || null,
      description: description || null,
      whatsapp: whatsapp?.trim(),
      logo_url: logo_url || null,
      color: color || '#ff6b35',
      currency: currency || 'S/',
      branding_text: branding_text !== undefined ? branding_text : 'Creado con MenuPro',
      is_published: typeof is_published === 'boolean' ? is_published : false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (menuErr) {
    return NextResponse.json({ error: menuErr.message }, { status: 500 });
  }

  // Si vienen categorias, reemplazar todas
  if (Array.isArray(categories)) {
    // Borrar categorias y platos existentes (cascade)
    const { error: delErr } = await supabase
      .from('categories')
      .delete()
      .eq('menu_id', id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Insertar nuevas categorias y platos
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const { data: newCat, error: catErr } = await supabase
        .from('categories')
        .insert({
          menu_id: id,
          name: cat.name?.trim(),
          sort_order: i,
        })
        .select()
        .single();

      if (catErr || !newCat) {
        return NextResponse.json({ error: catErr?.message || 'Error categoria' }, { status: 500 });
      }

      if (Array.isArray(cat.dishes)) {
        for (let j = 0; j < cat.dishes.length; j++) {
          const dish = cat.dishes[j];
          const { error: dishErr } = await supabase
            .from('dishes')
            .insert({
              category_id: newCat.id,
              name: dish.name?.trim(),
              description: dish.description || null,
              price: Number(dish.price) || 0,
              image_url: dish.image_url || null,
              sort_order: j,
            });
          if (dishErr) {
            return NextResponse.json({ error: dishErr.message }, { status: 500 });
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/menus/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
