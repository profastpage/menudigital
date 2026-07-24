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
    maxImages: number;
    hasQR: boolean;
    hasBranding: boolean; // true = muestra marca MenuPro
    hasAnalytics: boolean;
  };
  features: string[];
  highlight?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceUsd: 0,
    limits: {
      maxMenus: 1,
      maxDishesPerMenu: 15,
      maxImages: 5,
      hasQR: false,
      hasBranding: true,
      hasAnalytics: false,
    },
    features: [
      '1 menú digital',
      'Hasta 15 platos',
      'Hasta 5 imágenes',
      'Carrito con WhatsApp',
      'URL pública /r/tu-restaurante',
      'Vista previa en vivo',
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
      maxImages: 30,
      hasQR: true,
      hasBranding: false,
      hasAnalytics: true,
    },
    highlight: true,
    features: [
      'Menús ilimitados',
      'Platos ilimitados',
      'Hasta 30 imágenes',
      'Carrito con WhatsApp',
      'URL pública personalizada',
      'Vista previa en vivo',
      'Sin marca MenuPro',
      'Código QR descargable',
      'Analytics de visitas',
      'Soporte prioritario',
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

export function canUploadImage(currentCount: number, plan: Plan): boolean {
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
