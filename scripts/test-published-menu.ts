/**
 * Test script: genera un HTML de muestra del menú publicado y lo guarda
 * en download/ para verificarlo con Playwright.
 *
 * Uso:
 *   node --experimental-strip-types scripts/test-published-menu.ts
 *   # o
 *   npx jiti scripts/test-published-menu.ts
 */
import { buildMenuHTML } from '../src/app/dashboard/[menuId]/menu-html-builder';
import { escapeHtml, hexToRgbStr, type MenuData } from '../src/lib/menu-utils';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Provide a stub for the menu-utils import inside menu-html-builder
// (jiti can't resolve the @/ alias without tsconfig-paths setup)

const sampleData: any = {
  id: 'test-123',
  name: 'Pollería El Sabroso',
  slogan: 'El sabor que enamora',
  description: 'Pollería braseada con leña, comida peruana tradicional.',
  whatsapp: '51999999999',
  logo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
  cover_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
  color: '#ff6b35',
  theme_color_secondary: '#1a1a2e',
  theme_layout: 'single',
  theme_image_size: 'medium',
  theme_card_style: 'expanded',
  theme_font: 'Inter',
  theme_dark_mode: true,
  theme_show_search: true,
  theme_show_category_icons: true,
  theme_rounded_corners: true,
  theme_cover_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
  theme_dish_gallery: true,
  theme_carta_style: false,
  theme_carta_list_style: false,
  theme_hybrid_style: false,
  theme_sticky_top_bar: true,
  social_facebook: 'https://facebook.com/',
  social_instagram: 'https://instagram.com/',
  social_whatsapp: '51999999999',
  social_tiktok: '',
  social_twitter: '',
  social_youtube: '',
  social_web: '',
  branding_text: 'Creado con MenuPro',
  categories: [
    {
      id: 'cat1',
      name: 'Entradas',
      icon: '🥗',
      dishes: [
        {
          id: 'd1',
          name: 'Causa Limeña',
          description: 'Papa amarilla peruana, palta, atún, huevo, aceitunas. Receta tradicional.',
          price: 12.5,
          image_url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600',
        },
        {
          id: 'd2',
          name: 'Ceviche Mixto',
          description: 'Pescado fresco, camarones, pulpo, con leche de tigre y cebolla morada.',
          price: 28.0,
          image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
        },
        {
          id: 'd3',
          name: 'Anticuchos de Corazón',
          description: 'Brochetas a la parrilla con ají panca, papas doradas y salsa huacatay.',
          price: 18.0,
          image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600',
        },
      ],
    },
    {
      id: 'cat2',
      name: 'Platos de Fondo',
      icon: '🍽️',
      dishes: [
        {
          id: 'd4',
          name: 'Pollo a la Brasa',
          description: '1/4 pollo braseado con leña, papas fritas, ensalada y salsas de la casa.',
          price: 22.0,
          image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600',
        },
        {
          id: 'd5',
          name: 'Lomo Saltado',
          description: 'Lomo de res salteado con cebolla, tomate, papas fritas y arroz blanco.',
          price: 25.0,
          image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
        },
        {
          id: 'd6',
          name: 'Ají de Gallina',
          description: 'Crema de pollo deshilachado con ají amarillo, nueces y arroz.',
          price: 20.0,
          image_url: 'https://images.unsplash.com/photo-1604908554049-29bf08f5d1a8?w=600',
        },
        {
          id: 'd7',
          name: 'Chaufa Especial',
          description: 'Arroz chaufa con pollo, cecina, huevo y tortilla. Estilo chifa.',
          price: 19.5,
          image_url: '',
        },
      ],
    },
    {
      id: 'cat3',
      name: 'Bebidas',
      icon: '🥤',
      dishes: [
        {
          id: 'd8',
          name: 'Chicha Morada',
          description: 'Bebida tradicional de maíz morado con piña, manzana y canela.',
          price: 6.0,
          image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600',
        },
        {
          id: 'd9',
          name: 'Maracuyá Sour',
          description: 'Coctel de maracuyá con pisco quebranta, hielo y clara de huevo.',
          price: 15.0,
          image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600',
        },
      ],
    },
  ],
};

const html = buildMenuHTML(sampleData, { isPreview: false });
const outPath = '/home/z/my-project/download/menu-published-test.html';
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, 'utf-8');
console.log(`✓ HTML generado: ${outPath} (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`✓ Total líneas: ${html.split('\n').length}`);
