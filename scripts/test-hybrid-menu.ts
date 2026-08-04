#!/usr/bin/env node
/**
 * Test script: generate a sample menu HTML using buildMenuHTML
 * with hybrid mode + sticky bar + search overlay enabled.
 * Save to /home/z/my-project/download/test-hybrid-menu.html
 *
 * Run with: npx tsx scripts/test-hybrid-menu.ts
 */
import { buildMenuHTML } from '../src/app/dashboard/[menuId]/menu-html-builder';
import type { MenuData } from '../src/lib/menu-utils';
import fs from 'fs';

const sampleMenu: MenuData = {
  id: 'test-hybrid',
  user_id: 'test',
  name: 'Pollería El Dorado Chicken',
  slug: 'polleria-test',
  slogan: 'El mejor pollo a la brasa',
  description: 'Pollo a la brasa, broaster y más',
  whatsapp: '51987654321',
  logo_url: null,
  color: '#dc2626',
  currency: 'S/',
  branding_text: 'Creado con MenuPro',
  is_published: true,
  views_count: 0,
  created_at: '',
  updated_at: '',
  // Theme
  theme_color_secondary: '#1a1a2e',
  theme_font: 'Inter',
  theme_layout: 'single',
  theme_image_size: 'medium',
  theme_card_style: 'expanded',
  theme_cover_url: null,
  theme_show_search: true,
  theme_show_category_icons: true,
  theme_rounded_corners: true,
  theme_dark_mode: true,
  theme_dish_gallery: true,
  theme_preset_id: null,
  // Carta style (off — using hybrid instead)
  theme_carta_style: false,
  theme_carta_list_style: false,
  theme_carta_autoscroll: false,
  theme_carta_scroll_speed: 30,
  // HYBRID MODE — categorías con estilos mixtos
  theme_hybrid_style: true,
  theme_hybrid_config: JSON.stringify({
    '0': 'carousel',   // Pollos a la Brasa → carrusel
    '1': 'list',       // Pollo Broaster → lista Rappi
    '2': 'classic',    // Guarniciones → clásico
    '3': 'carousel',   // Bebidas → carrusel
  }),
  theme_sticky_top_bar: true,
  // Socials
  social_facebook: null,
  social_instagram: 'polloreseldorado',
  social_whatsapp: '51987654321',
  social_tiktok: null,
  social_twitter: null,
  social_youtube: null,
  social_web: null,
  categories: [
    {
      id: 'cat-0',
      menu_id: 'test-hybrid',
      name: 'Pollos a la Brasa',
      sort_order: 0,
      dishes: [
        { id: 'd1', category_id: 'cat-0', name: 'Pollo a la Brasa Entero', description: '1 pollo entero (8 presas) ahumado al carbón', price: 58, image_url: null, gallery: null, options: null, sort_order: 0 },
        { id: 'd2', category_id: 'cat-0', name: 'Pollo a la Brasa 1/2', description: 'Medio pollo (4 presas) con papas', price: 32, image_url: null, gallery: null, options: null, sort_order: 1 },
        { id: 'd3', category_id: 'cat-0', name: 'Pollo a la Brasa 1/4', description: 'Cuarto de pollo (2 presas)', price: 18, image_url: null, gallery: null, options: null, sort_order: 2 },
        { id: 'd4', category_id: 'cat-0', name: 'Combo Familiar', description: 'Pollo entero + papas + ensalada + gaseosa 1.5L', price: 75, image_url: null, gallery: null, options: null, sort_order: 3 },
      ],
    },
    {
      id: 'cat-1',
      menu_id: 'test-hybrid',
      name: 'Pollo Broaster',
      sort_order: 1,
      dishes: [
        { id: 'd5', category_id: 'cat-1', name: 'Pollo Broaster 8 piezas', description: '8 piezas crujientes con papas', price: 45, image_url: null, gallery: null, options: null, sort_order: 0 },
        { id: 'd6', category_id: 'cat-1', name: 'Pollo Broaster 4 piezas', description: '4 piezas con papas y salsa', price: 28, image_url: null, gallery: null, options: null, sort_order: 1 },
        { id: 'd7', category_id: 'cat-1', name: 'Nuggets de Pollo', description: '10 nuggets crujientes', price: 22, image_url: null, gallery: null, options: null, sort_order: 2 },
      ],
    },
    {
      id: 'cat-2',
      menu_id: 'test-hybrid',
      name: 'Guarniciones',
      sort_order: 2,
      dishes: [
        { id: 'd8', category_id: 'cat-2', name: 'Papas Fritas Grandes', description: 'Porción grande de papas crujientes', price: 12, image_url: null, gallery: null, options: null, sort_order: 0 },
        { id: 'd9', category_id: 'cat-2', name: 'Ensalada Mixta', description: 'Lechuga, tomate, zanahoria, palta', price: 15, image_url: null, gallery: null, options: null, sort_order: 1 },
        { id: 'd10', category_id: 'cat-2', name: 'Arroz Chaufa', description: 'Arroz frito con pollo y vegetales', price: 18, image_url: null, gallery: null, options: null, sort_order: 2 },
        { id: 'd11', category_id: 'cat-2', name: 'Yuca Frita', description: 'Porción de yuca frita crujiente', price: 10, image_url: null, gallery: null, options: null, sort_order: 3 },
      ],
    },
    {
      id: 'cat-3',
      menu_id: 'test-hybrid',
      name: 'Bebidas',
      sort_order: 3,
      dishes: [
        { id: 'd12', category_id: 'cat-3', name: 'Coca-Cola 1.5L', description: 'Gaseosa familiar', price: 9, image_url: null, gallery: null, options: null, sort_order: 0 },
        { id: 'd13', category_id: 'cat-3', name: 'Inca Kola 1.5L', description: 'Gaseosa familiar', price: 9, image_url: null, gallery: null, options: null, sort_order: 1 },
        { id: 'd14', category_id: 'cat-3', name: 'Chicha Morada 1L', description: 'Chicha morada casera', price: 12, image_url: null, gallery: null, options: null, sort_order: 2 },
        { id: 'd15', category_id: 'cat-3', name: 'Limonada Fría', description: 'Limonada con hielo', price: 7, image_url: null, gallery: null, options: null, sort_order: 3 },
      ],
    },
  ],
};

const html = buildMenuHTML(sampleMenu, { isPreview: false });
const outPath = '/home/z/my-project/download/test-hybrid-menu.html';
fs.writeFileSync(outPath, html);
console.log(`✅ Generated: ${outPath}`);
console.log(`   Size: ${html.length} bytes`);
console.log(`   Hybrid mode: ON (cat-0: carousel, cat-1: list, cat-2: classic, cat-3: carousel)`);
console.log(`   Sticky top bar: ON`);
console.log(`   Search overlay: ON`);
console.log(`   Total dishes: 15 across 4 categories`);
