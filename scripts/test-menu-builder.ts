// Quick smoke test: build a sample menu HTML and check for common errors
import { buildMenuHTML } from '../src/app/dashboard/[menuId]/menu-html-builder';
import type { MenuData } from '../src/lib/menu-utils';
import * as fs from 'fs';

const sampleMenu: MenuData = {
  id: 'test-menu-id',
  user_id: 'test-user',
  slug: 'dolce-caffe-test',
  name: 'Dolce Caffè Artisan',
  description: 'Cafetería artisan',
  whatsapp: '51999999999',
  color: '#10b981',
  is_published: true,
  currency: 'S/',
  logo_url: 'https://example.com/logo.png',
  theme_layout: 'single',
  theme_image_size: 'medium',
  theme_card_style: 'expanded',
  theme_font: 'Inter',
  theme_dark_mode: true,
  theme_show_search: true,
  theme_show_category_icons: true,
  theme_rounded_corners: true,
  theme_cover_url: null,
  theme_color_secondary: '#1a1a2e',
  theme_dish_gallery: true,
  theme_carta_style: false,
  theme_carta_list_style: false,
  theme_hybrid_style: false,
  theme_sticky_top_bar: true,
  branding_text: 'Creado con MenuPro',
  categories: [
    {
      id: 'cat-1',
      menu_id: 'test-menu-id',
      name: 'Café de Especialidad',
      sort_order: 0,
      dishes: [
        {
          id: 'dish-1',
          category_id: 'cat-1',
          name: 'Espresso Single Origin',
          description: 'Chanchamayo. Notas a chocolate y frutos rojos.',
          price: 50,
          image_url: 'https://example.com/espresso.jpg',
          sort_order: 0,
        },
        {
          id: 'dish-2',
          category_id: 'cat-1',
          name: 'Latte',
          description: 'Café con leche cremosa',
          price: 45,
          image_url: '',
          sort_order: 1,
        },
      ],
    },
    {
      id: 'cat-2',
      menu_id: 'test-menu-id',
      name: 'Postres Finos',
      sort_order: 1,
      dishes: [
        {
          id: 'dish-3',
          category_id: 'cat-2',
          name: 'Tiramisú',
          description: 'Clásico italiano',
          price: 60,
          image_url: '',
          sort_order: 0,
        },
      ],
    },
  ],
} as unknown as MenuData;

const html = buildMenuHTML(sampleMenu);

// Sanity checks
const checks: { name: string; pass: boolean; detail?: string }[] = [
  { name: 'HTML is non-empty string', pass: typeof html === 'string' && html.length > 1000 },
  { name: 'Has <!DOCTYPE html>', pass: html.startsWith('<!DOCTYPE html>') },
  { name: 'Has mini-header element', pass: html.includes('id="miniHeader"') },
  { name: 'Has mini-header-theme-toggle', pass: html.includes('mini-header-theme-toggle') },
  { name: 'Has theme-toggle-btn', pass: html.includes('theme-toggle-btn') },
  { name: 'NO floating theme-toggle-btn (separate)', pass: !html.includes('<button class="theme-toggle-btn" id="themeToggleBtn"') || html.includes('mini-header-theme-toggle theme-toggle-btn') },
  { name: 'Has bottom-cats-bar element', pass: html.includes('id="bottomCatsBar"') },
  { name: 'Has bottom-cats-inner element', pass: html.includes('id="bottomCatsInner"') },
  { name: 'Has mobile-bottom-nav with 6 buttons', pass: (html.match(/class="mbn-item/g) || []).length >= 6 },
  { name: 'Has mbn-top-btn (Subir)', pass: html.includes('mbn-top-btn') },
  { name: 'Has mbn-install-item', pass: html.includes('mbn-install-item') },
  { name: 'NO old floating scroll-top-btn', pass: !html.includes('class="scroll-top-btn"') },
  { name: 'Has dish-lightbox-back CSS', pass: html.includes('.dish-lightbox-back{') },
  { name: 'Has .installed display:none CSS', pass: html.includes('.mbn-install-item.installed{display:none') },
  { name: 'Has scroll spy IntersectionObserver', pass: html.includes('IntersectionObserver') },
  { name: 'Has mini-header SIEMPRE visible note', pass: html.includes('mini-header SIEMPRE visible') || html.includes('transform:translateY(0)') },
  { name: 'Has .nav hidden on mobile', pass: html.includes('.nav{display:none') },
  { name: 'Has body padding-top for mini-header', pass: html.includes('padding-top:calc(54px') },
  { name: 'Theme toggle JS uses querySelectorAll', pass: html.includes('document.querySelectorAll(".theme-toggle-btn")') },
  { name: 'Has display-mode: standalone CSS', pass: html.includes('display-mode: standalone') },
];

let passCount = 0;
checks.forEach(c => {
  const status = c.pass ? '✓' : '✗';
  console.log(`${status} ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
  if (c.pass) passCount++;
});
console.log(`\n${passCount}/${checks.length} checks passed`);

// Save the HTML for visual inspection
fs.writeFileSync('/home/z/my-project/download/test-menu.html', html);
console.log('HTML saved to /home/z/my-project/download/test-menu.html');

if (passCount !== checks.length) {
  process.exit(1);
}
