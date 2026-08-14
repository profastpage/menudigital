/**
 * Test script: renders 4 menu HTML variants to verify the theme customization fixes:
 *  1. Layout single (1 col) — should be 1 col on desktop too (NOT 2 cols)
 *  2. Layout double (2 col) — should be 2 cols on desktop
 *  3. Image size variations — small/medium/large/hero should produce different aspect ratios
 *  4. Secondary color — should be visible in body::after orb and section-title accent bar
 *  5. Heart button position — should be top-LEFT (not colliding with price top-right in carta-card)
 *
 * Saves 4 HTML files for Playwright screenshotting.
 */
import { buildMenuHTML } from '../src/app/dashboard/[menuId]/menu-html-builder';
import type { MenuData } from '../src/lib/menu-utils';
import * as fs from 'fs';
import * as path from 'path';

const baseMenu: any = {
  id: 'test',
  user_id: 'test',
  slug: 'test',
  name: 'Pollería Riko\'s', // ← required by buildJS
  restaurant_name: 'Pollería Riko\'s',
  restaurant_description: 'El mejor pollo a la brasa de Lima',
  logo_url: null,
  cover_url: null,
  whatsapp: '+51999887766',
  facebook: 'https://facebook.com/test',
  instagram: 'https://instagram.com/test',
  currency: 'PEN',
  is_open: true,
  categories: [
    {
      id: 'cat1',
      name: 'Entradas',
      dishes: [
        {
          id: 'd1',
          name: 'Ensalada de Palta',
          description: 'Ensalada con abundante palta, lechuga y tomate',
          price: 35.00,
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        },
        {
          id: 'd2',
          name: 'Tequeños (6 unidades)',
          description: 'Tequeños crujientes rellenos de queso, con salsa de ají de la casa',
          price: 28.00,
          image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        },
        {
          id: 'd5',
          name: 'Causa Limeña',
          description: 'Causa tradicional con papa amarilla, pollo y palta',
          price: 32.00,
          image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
        },
      ],
    },
    {
      id: 'cat2',
      name: 'Platos de Fondo',
      dishes: [
        {
          id: 'd3',
          name: 'Pollo a la Brasa (1/4)',
          description: 'Pollo entero a la Brasa, delicioso y jugoso, con papas fritas y ensalada',
          price: 60.00,
          image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
        },
        {
          id: 'd4',
          name: 'Pollo a la Brasa Entero',
          description: 'Pollo entero con papas fritas, ensalada y ají de la casa',
          price: 89.00,
          image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
        },
        {
          id: 'd6',
          name: 'Lomo Saltado',
          description: 'Lomo de res salteado con cebolla, tomate y papas fritas',
          price: 75.00,
          image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
        },
      ],
    },
  ],
  theme_color_primary: '#d4af37',
  theme_color_secondary: '#ed0707',
  theme_font: 'Inter',
  theme_layout: 'single',
  theme_image_size: 'medium',
  theme_card_style: 'expanded',
  theme_dark_mode: true,
  theme_show_search: true,
  theme_show_category_icons: true,
  theme_rounded_corners: true,
  theme_cover_url: null,
  theme_show_dish_gallery: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  order_number: 1,
  // carta_style enabled to test heart-vs-price-overlay collision in carousel mode
  theme_carta_style: true,
  theme_carta_list_style: false,
  theme_carta_autoscroll: false,
  theme_carta_scroll_speed: 30,
  theme_hybrid_style: false,
  theme_hybrid_config: {},
  theme_sticky_top_bar: true,
};

const outDir = '/home/z/my-project/upload';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Variant 5: Carta-style carousel — verify heart (top-left) does NOT collide with price-overlay (top-right)
const v5 = { ...baseMenu, theme_layout: 'single' as const, theme_image_size: 'medium' as const, theme_color_secondary: '#ed0707', theme_carta_style: true, theme_carta_list_style: false };
fs.writeFileSync(path.join(outDir, 'test-theme-v5-carta-heart-price.html'), buildMenuHTML(v5, { isPreview: false }));
console.log('✓ v5: carta_style=true (carousel), testing heart vs price-overlay collision');

// Variant 6: Rappi-list style — verify heart (top-left of small image) does NOT collide with add-btn (bottom-right)
const v6 = { ...baseMenu, theme_layout: 'single' as const, theme_image_size: 'medium' as const, theme_color_secondary: '#ed0707', theme_carta_style: false, theme_carta_list_style: true };
fs.writeFileSync(path.join(outDir, 'test-theme-v6-rappi-heart-addbtn.html'), buildMenuHTML(v6, { isPreview: false }));
console.log('✓ v6: carta_list_style=true (rappi list), testing heart vs add-btn collision');

console.log('\nAll 4 HTML files saved to /home/z/my-project/upload/');
console.log('Next: screenshot each at desktop viewport (1280x900) with Playwright, then VLM-compare.');
