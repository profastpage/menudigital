// Tipos compartidos
export interface MenuData {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  slogan: string | null;
  description: string | null;
  whatsapp: string;
  logo_url: string | null;
  color: string;
  currency: string;
  branding_text: string | null;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  categories?: CategoryData[];
}

export interface CategoryData {
  id: string;
  menu_id: string;
  name: string;
  sort_order: number;
  dishes?: DishData[];
}

export interface DishData {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  sort_order: number;
}

export interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

// Generar slug desde nombre
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// Formatear precio según moneda
export function formatPrice(amount: number, currency: string = 'S/'): string {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

// Hex → RGB string (para CSS variables)
export function hexToRgbStr(hex: string): string {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `${r}, ${g}, ${b}`;
}

// Escape HTML
export function escapeHtml(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
