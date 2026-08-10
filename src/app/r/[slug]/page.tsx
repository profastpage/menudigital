import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { buildMenuHTML } from '@/app/dashboard/[menuId]/menu-html-builder';
import type { MenuData } from '@/lib/menu-utils';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// ─── OG Image dinámica por plan ───
// Premium/Full → foto de perfil (logo_url) de la carta del cliente
// Free/Pro → imagen oficial de Menú Digital Pro (/og-image.png)
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://menudigital.pro';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: menu } = await supabase
    .from('menus')
    .select('id, name, description, slug, logo_url, user_id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!menu) {
    return {
      title: 'Menú no encontrado',
      description: 'El menú que buscas no existe o no está publicado.',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', menu.user_id)
    .single();

  const plan = profile?.plan || 'free';
  const isPremiumOrFull = plan === 'premium' || plan === 'full';

  // OG image: Premium/Full → logo_url del cliente (con fallback a og-image.png si no hay logo)
  // Free/Pro → /og-image.png (oficial Menú Digital Pro)
  let ogImageUrl = `${SITE_ORIGIN}/og-image.png`;
  if (isPremiumOrFull && menu.logo_url) {
    // Si la URL ya es absoluta (Supabase Storage), usarla tal cual.
    // Si es relativa, prefijar con SITE_ORIGIN.
    ogImageUrl = menu.logo_url.startsWith('http')
      ? menu.logo_url
      : `${SITE_ORIGIN}${menu.logo_url}`;
  }

  const title = `${menu.name} — Carta Digital`;
  const description =
    menu.description || `Mira la carta de ${menu.name} y haz tu pedido por WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'MenuPro',
      url: `${SITE_ORIGIN}/r/${menu.slug}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: menu.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Buscar menu por slug (debe estar publicado)
  const { data: menu } = await supabase
    .from('menus')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!menu) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#07070b] text-white p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Menú no encontrado</h1>
          <p className="text-white/60 mb-6">
            El menú que buscas no existe o no está publicado.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-[#d4af37] text-[#1a1a2e] font-semibold hover:opacity-90"
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  // Cargar categorias y platos
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('menu_id', menu.id)
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

  // Determinar si mostrar branding: Free y Pro muestran "Creado con MenuPro" con hipervínculo.
  // Premium y Full son white label (sin marca).
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', menu.user_id)
    .single();

  // Planes Free y Pro muestran branding (con hipervínculo al landing — genera leads orgánicos)
  const showBranding = ['free', 'pro'].includes(profile?.plan || 'free');

  const fullMenu: MenuData = {
    ...menu,
    branding_text: showBranding ? 'Creado con MenuPro' : null,
    plan: (profile?.plan as MenuData['plan']) || 'free',
    categories: categoriesWithDishes,
  } as MenuData;

  // Registrar visita (fire-and-forget, no bloquea render)
  registerView(menu.id).catch(() => {});

  const html = buildMenuHTML(fullMenu);

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}

async function registerView(menuId: string) {
  const supabase = await createClient();
  // Insert en menu_views (policy permite insert anónimo)
  await supabase.from('menu_views').insert({
    menu_id: menuId,
  });
  // Incrementar contador
  await supabase.rpc('increment_menu_views', { menu_uuid: menuId });
}

// Reexportar NextResponse para evitar tree-shake (no se usa pero evita warnings)
export const _unused = NextResponse;
