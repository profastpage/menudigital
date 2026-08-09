// Generate a sample menu HTML and write to public/ for browser testing
// Uses the same buildMenuHTML function as the production /r/[slug] route.
import { buildMenuHTML } from '../src/app/dashboard/[menuId]/menu-html-builder';
import { writeFileSync } from 'fs';

// Sample menu that mimics "Dolce Caffè Artisan" from the screenshots
// Green accent color (#10b981) to match the screenshots
const sampleMenu: any = {
  id: 'test-dolce',
  user_id: 'test-user',
  name: 'Dolce Caffé Artisan',
  slug: 'dolce-caffe-artisan',
  slogan: 'Café de especialidad · Repostería francesa',
  description: 'Cafetería artesanal con granos de especialidad y repostería francesa recién hecha.',
  whatsapp: '51990000000',
  logo_url: '',
  color: '#10b981', // verde esmeralda (matches screenshots)
  currency: 'S/',
  branding_text: null,
  is_published: true,
  views_count: 0,
  created_at: '',
  updated_at: '',
  theme_color_secondary: '#064e3b',
  theme_font: 'Inter',
  theme_layout: 'single',
  theme_image_size: 'medium',
  theme_card_style: 'expanded',
  theme_cover_url: '',
  theme_show_search: true,
  theme_show_category_icons: true,
  theme_rounded_corners: true,
  theme_dark_mode: true,
  theme_dish_gallery: true,
  social_facebook: '',
  social_instagram: '@dolcecaffe',
  social_whatsapp: '',
  social_tiktok: '',
  social_twitter: '',
  social_youtube: '',
  social_web: '',
  categories: [
    {
      id: 'cat-1', menu_id: 'test-dolce', name: 'Café de Especialidad', sort_order: 0,
      dishes: [
        { id: 'd-1', category_id: 'cat-1', name: 'Espresso Doble', description: 'Doble shot de café de especialidad tostado en casa.', price: 8, image_url: 'https://images.unsplash.com/photo-1571877221080-a3dca66a22c3?w=400&q=80', sort_order: 0 },
        { id: 'd-2', category_id: 'cat-1', name: 'Cappuccino Italiano', description: 'Espresso con leche vaporizada y espuma sedosa.', price: 12, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4048607a?w=400&q=80', sort_order: 1 },
        { id: 'd-3', category_id: 'cat-1', name: 'Latte de Avellana', description: 'Espresso con leche, jarabe de avellana y arte latte.', price: 14, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4048607a?w=400&q=80', sort_order: 2 },
      ],
    },
    {
      id: 'cat-2', menu_id: 'test-dolce', name: 'Postres Franceses', sort_order: 1,
      dishes: [
        { id: 'd-4', category_id: 'cat-2', name: 'Pain au Chocolat', description: 'Con chocolate belga.', price: 10, image_url: '', sort_order: 0 },
        { id: 'd-5', category_id: 'cat-2', name: 'Croissant de Almendras', description: 'Con crema frangipane.', price: 12, image_url: '', sort_order: 1 },
      ],
    },
    {
      id: 'cat-3', menu_id: 'test-dolce', name: 'Repostería', sort_order: 2,
      dishes: [
        { id: 'd-6', category_id: 'cat-3', name: 'Tarta de Frutos Rojos', description: 'Masa quebrada, crema pastelera y frutos rojos frescos.', price: 16, image_url: '', sort_order: 0 },
        { id: 'd-7', category_id: 'cat-3', name: 'Eclair de Chocolate', description: 'Masa choux rellena de crema de chocolate.', price: 14, image_url: '', sort_order: 1 },
      ],
    },
    {
      id: 'cat-4', menu_id: 'test-dolce', name: 'Té y Otras Bebidas', sort_order: 3,
      dishes: [
        { id: 'd-8', category_id: 'cat-4', name: 'Té de Hierbas', description: 'Manzanilla, menta o hierbabuena.', price: 8, image_url: '', sort_order: 0 },
        { id: 'd-9', category_id: 'cat-4', name: 'Chocolate Caliente Belga', description: 'Con crema y malvaviscos.', price: 14, image_url: '', sort_order: 1 },
      ],
    },
    {
      id: 'cat-5', menu_id: 'test-dolce', name: 'Salados', sort_order: 4,
      dishes: [
        { id: 'd-10', category_id: 'cat-5', name: 'Croissant Jamón y Queso', description: 'Croissant fresco con jamón y queso gratinado.', price: 14, image_url: '', sort_order: 0 },
        { id: 'd-11', category_id: 'cat-5', name: 'Quiche Lorraine', description: 'Tarta salada con tocino, queso y crema.', price: 18, image_url: '', sort_order: 1 },
      ],
    },
    {
      id: 'cat-6', menu_id: 'test-dolce', name: 'Combos', sort_order: 5,
      dishes: [
        { id: 'd-12', category_id: 'cat-6', name: 'Combo Café + Croissant', description: 'Cappuccino + croissant de almendras.', price: 22, image_url: '', sort_order: 0 },
      ],
    },
  ],
};

const html = buildMenuHTML(sampleMenu, { isPreview: false });
writeFileSync('/home/z/my-project/public/test-menu-v2.html', html);
console.log('Test menu written to /public/test-menu-v2.html');
console.log('Size:', html.length, 'bytes');
console.log('Classes found:');
['top-cats-bar', 'top-cats-inner', 'mini-header-install-btn', 'mini-header-theme-toggle',
 'webkit-scrollbar', 'scrollbar-color', 'mobile-bottom-nav', 'sticky-top-bar',
 'display-mode: standalone', 'appinstalled', 'matchMedia'].forEach(cls => {
  console.log('  ' + cls + ':', html.includes(cls) ? '✓' : '✗');
});
