export type PlanId = 'free' | 'pro';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number; // en Soles (PEN)
  priceUsd: number; // referencia
  mpAmount?: number; // monto cobrado por MercadoPago (solo Pro)
  limits: {
    maxMenus: number; // -1 = ilimitado
    maxDishesPerMenu: number;
    maxImages: number; // -1 = ilimitado
    maxCategories: number; // -1 = ilimitado
    hasQR: boolean;
    hasBranding: boolean; // true = muestra marca MenuPro
    hasAnalytics: boolean;
    hasBgRemoval: boolean;
    bgRemovalCredits: number; // créditos mensuales incluidos en Pro
    hasMultiLanguage: boolean;
    hasHDQR: boolean;
  };
  features: string[];
  highlight?: boolean;
}

/**
 * PLAN FREE — Adquisición + Viralidad
 * Útil pero incompleto: suficiente para probar y compartir,
 * pero con límites que empujan el upgrade cuando el restaurante crece.
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceUsd: 0,
    limits: {
      maxMenus: 1,
      maxDishesPerMenu: 10,
      maxImages: 5,
      maxCategories: 3,
      hasQR: true, // QR básico (vista web, no descargable en HD)
      hasBranding: true,
      hasAnalytics: false,
      hasBgRemoval: false,
      bgRemovalCredits: 0,
      hasMultiLanguage: false,
      hasHDQR: false,
    },
    features: [
      '1 menú activo',
      'Hasta 10 platos',
      'Hasta 5 imágenes',
      'Hasta 3 categorías',
      'Carrito integrado con WhatsApp',
      'URL pública /r/tu-restaurante',
      'Vista previa en vivo',
      'QR básico (solo vista web)',
      'Marca "Creado con MenuPro"',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 35,
    priceUsd: 9,
    mpAmount: 35, // cobrado por MercadoPago cada mes
    limits: {
      maxMenus: -1,
      maxDishesPerMenu: -1,
      maxImages: -1,
      maxCategories: -1,
      hasQR: true,
      hasBranding: false,
      hasAnalytics: true,
      hasBgRemoval: true,
      bgRemovalCredits: 5, // 5 quitadores de fondo por mes incluidos
      hasMultiLanguage: true,
      hasHDQR: true,
    },
    highlight: true,
    features: [
      'Menús ilimitados',
      'Platos ilimitados',
      'Imágenes ilimitadas + optimización WebP',
      'Categorías ilimitadas + etiquetas (vegano, picante, popular)',
      '5 créditos de "Quitar fondo" por mes',
      'Carrito integrado con WhatsApp',
      'URL pública personalizada',
      'QR profesional en HD + dinámico (editable sin reimprimir)',
      'Analytics: visitas, clics WhatsApp, platos más vistos',
      'Menú multi-idioma (ES/EN)',
      '100% white-label (sin marca MenuPro)',
      'Soporte prioritario por WhatsApp',
      'Próximamente: integración con apps de delivery',
    ],
  },
};

export function getPlan(planId: string): Plan {
  return PLANS[planId as PlanId] ?? PLANS.free;
}

export function canCreateMenu(currentCount: number, plan: Plan): boolean {
  if (plan.limits.maxMenus === -1) return true;
  return currentCount < plan.limits.maxMenus;
}

export function canAddDish(currentCount: number, plan: Plan): boolean {
  if (plan.limits.maxDishesPerMenu === -1) return true;
  return currentCount < plan.limits.maxDishesPerMenu;
}

export function canAddCategory(currentCount: number, plan: Plan): boolean {
  if (plan.limits.maxCategories === -1) return true;
  return currentCount < plan.limits.maxCategories;
}

export function canUploadImage(currentCount: number, plan: Plan): boolean {
  if (plan.limits.maxImages === -1) return true;
  return currentCount < plan.limits.maxImages;
}

export const COLORS = [
  { hex: '#ff6b35', name: 'Naranja Vibrante' },
  { hex: '#e63946', name: 'Rojo Premium' },
  { hex: '#06d6a0', name: 'Verde Esmeralda' },
  { hex: '#118ab2', name: 'Azul Profundo' },
  { hex: '#9d4edd', name: 'Morado Real' },
  { hex: '#d4af37', name: 'Dorado Champagne' },
];

export const CURRENCIES = [
  { value: 'S/', label: 'S/ Soles (Perú)' },
  { value: '$', label: '$ Dólares' },
  { value: '€', label: '€ Euros' },
  { value: 'Bs', label: 'Bs Bolivianos' },
  { value: '₲', label: '₲ Guaraníes' },
  { value: 'AR$', label: 'AR$ Pesos Arg' },
  { value: '$U', label: '$U Pesos Uru' },
  { value: 'CLP$', label: 'CLP$ Pesos Chilenos' },
  { value: 'MX$', label: 'MX$ Pesos Mexicanos' },
  { value: 'R$', label: 'R$ Reales' },
];
