import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PLANS } from '@/lib/plans';
import { EditorClient } from './editor-client';
import type { MenuData, ProfileData } from '@/lib/menu-utils';

export default async function EditorPage({
  params,
}: {
  params: Promise<{ menuId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { menuId } = await params;

  // Cargar menu con categorias y platos
  const { data: menu } = await supabase
    .from('menus')
    .select('*')
    .eq('id', menuId)
    .eq('user_id', user.id)
    .single();

  if (!menu) {
    redirect('/dashboard');
  }

  // Profile (lo cargamos antes para validar el bloqueo por downgrade)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const plan = PLANS[profile?.plan || 'free'];

  // ⚠️ DOWNGRADE LOCK (server-side):
  // Si el usuario tenía más menús creados (de un plan superior) y bajó de plan,
  // los menús que exceden el límite actual no pueden editarse.
  // El menú NO se elimina (preservación de datos) pero el editor se bloquea.
  if (plan.limits.maxMenus !== -1) {
    const { data: allMenus } = await supabase
      .from('menus')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const menuIndex = (allMenus || []).findIndex((m) => m.id === menuId);
    // Si el menú está más allá del límite del plan actual, bloquear
    if (menuIndex >= plan.limits.maxMenus) {
      // En vez de denegar acceso (lo que sería confuso), pasamos un flag al editor
      // para que muestre el overlay de bloqueo en lugar del editor real.
      const fullMenuLocked: MenuData = {
        ...menu,
        categories: [],
      } as MenuData;
      return (
        <EditorClient
          initialMenu={fullMenuLocked}
          plan={plan}
          profile={profile as ProfileData}
          imagesCount={0}
          lockedDueToDowngrade={true}
        />
      );
    }
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('menu_id', menuId)
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

  // Contar imágenes del usuario
  const { data: userFiles } = await supabase.storage
    .from('menus')
    .list(user.id, { limit: 1000 });

  const fullMenu: MenuData = {
    ...menu,
    categories: categoriesWithDishes,
  } as MenuData;

  return (
    <EditorClient
      initialMenu={fullMenu}
      plan={plan}
      profile={profile as ProfileData}
      imagesCount={userFiles?.length || 0}
    />
  );
}
