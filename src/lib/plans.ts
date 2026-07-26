export type PlanId = 'free' | 'pro' | 'premium' | 'full';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // en Soles (PEN)
  priceUsd: number; // referencia
  mpAmount?: number; // monto cobrado por MercadoPago
  limits: {
    maxMenus: number; // -1 = ilimitado
    maxDishesPerMenu: number;
    maxImages: number; // -1 = ilimitado
    maxCategories: number; // -1 = ilimitado
    hasQR: boolean;
    hasBranding: boolean; // true = muestra marca MenuPro
    hasAnalytics: boolean;
    hasBgRemoval: boolean;
    bgRemovalCredits: number;
    hasMultiLanguage: boolean;
    hasHDQR: boolean;
    // Premium+
    hasTables: boolean; // gestión de mesas
    hasWaiters: boolean; // gestión de mozos
    hasComandas: boolean; // sistema de comandas
    hasKitchenDisplay: boolean; // cocina display
    hasInventory: boolean; // inventario de insumos
    hasRecipes: boolean; // recetas plato → insumos
    maxTables: number; // -1 = ilimitado
    maxWaiters: number; // -1 = ilimitado
    // Full
    hasMultiBranch: boolean; // multi-sucursal
    hasVoucherPrinting: boolean; // imprimir vouchers POS
    hasAdvancedReports: boolean; // reportes avanzados
    maxBranches: number; // -1 = ilimitado
  };
  features: string[];
  highlight?: boolean;
  badge?: string;
  color: string; // hex para UI
}

/**
 * PLAN FREE — Adquisición + Viralidad
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Para empezar y validar',
    priceMonthly: 0,
    priceUsd: 0,
    color: '#6b7280',
    limits: {
      maxMenus: 1,
      maxDishesPerMenu: 10,
      maxImages: 5,
      maxCategories: 3,
      hasQR: true,
      hasBranding: true,
      hasAnalytics: false,
      hasBgRemoval: false,
      bgRemovalCredits: 0,
      hasMultiLanguage: false,
      hasHDQR: false,
      hasTables: false,
      hasWaiters: false,
      hasComandas: false,
      hasKitchenDisplay: false,
      hasInventory: false,
      hasRecipes: false,
      maxTables: 0,
      maxWaiters: 0,
      hasMultiBranch: false,
      hasVoucherPrinting: false,
      hasAdvancedReports: false,
      maxBranches: 0,
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
    tagline: 'Para restaurantes en serio',
    priceMonthly: 35,
    priceUsd: 9,
    mpAmount: 35,
    color: '#d4af37',
    highlight: true,
    badge: 'POPULAR',
    limits: {
      maxMenus: -1,
      maxDishesPerMenu: -1,
      maxImages: -1,
      maxCategories: -1,
      hasQR: true,
      hasBranding: false,
      hasAnalytics: true,
      hasBgRemoval: true,
      bgRemovalCredits: 30,
      hasMultiLanguage: true,
      hasHDQR: true,
      hasTables: false,
      hasWaiters: false,
      hasComandas: false,
      hasKitchenDisplay: false,
      hasInventory: false,
      hasRecipes: false,
      maxTables: 0,
      maxWaiters: 0,
      hasMultiBranch: false,
      hasVoucherPrinting: false,
      hasAdvancedReports: false,
      maxBranches: 0,
    },
    features: [
      'Menús ilimitados',
      'Platos ilimitados',
      'Imágenes ilimitadas + WebP',
      'Categorías ilimitadas + etiquetas',
      '30 créditos "Quitar fondo" por mes',
      'Carrito integrado con WhatsApp',
      'URL pública personalizada',
      'QR profesional HD + dinámico',
      'Analytics: visitas, clics WhatsApp, top platos',
      'Menú multi-idioma (ES/EN)',
      '100% white-label',
      'Soporte prioritario WhatsApp',
      'Tema PedidosYa/Rappi',
    ],
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: 'Logística interna completa',
    priceMonthly: 99,
    priceUsd: 26,
    mpAmount: 99,
    color: '#9d4edd',
    badge: 'PREMIUM',
    limits: {
      maxMenus: -1,
      maxDishesPerMenu: -1,
      maxImages: -1,
      maxCategories: -1,
      hasQR: true,
      hasBranding: false,
      hasAnalytics: true,
      hasBgRemoval: true,
      bgRemovalCredits: 100, // más créditos en premium
      hasMultiLanguage: true,
      hasHDQR: true,
      hasTables: true,
      hasWaiters: true,
      hasComandas: true,
      hasKitchenDisplay: true,
      hasInventory: true,
      hasRecipes: true,
      maxTables: 50,
      maxWaiters: 20,
      hasMultiBranch: false,
      hasVoucherPrinting: false,
      hasAdvancedReports: false,
      maxBranches: 1,
    },
    features: [
      'Todo lo del plan Pro',
      '100 créditos "Quitar fondo" por mes',
      '🍽️ Gestión de mesas (hasta 50)',
      '👨‍🍳 Gestión de mozos (hasta 20)',
      '📋 Comandas: mesa → mozo → cocina → entrega',
      '🔥 Cocina Display (cola de pedidos en tiempo real)',
      '📦 Inventario de insumos con stock mínimo',
      '🧾 Recetas: cada plato consume insumos automáticamente',
      '📊 Dashboard operacional en vivo',
      '⚡ Auto-descuento de stock al facturar',
      '🚨 Alertas de stock bajo',
    ],
  },

  full: {
    id: 'full',
    name: 'Full',
    tagline: 'Multi-sucursal + voucher printing',
    priceMonthly: 199,
    priceUsd: 52,
    mpAmount: 199,
    color: '#e63946',
    badge: 'FULL',
    limits: {
      maxMenus: -1,
      maxDishesPerMenu: -1,
      maxImages: -1,
      maxCategories: -1,
      hasQR: true,
      hasBranding: false,
      hasAnalytics: true,
      hasBgRemoval: true,
      bgRemovalCredits: -1, // ilimitado
      hasMultiLanguage: true,
      hasHDQR: true,
      hasTables: true,
      hasWaiters: true,
      hasComandas: true,
      hasKitchenDisplay: true,
      hasInventory: true,
      hasRecipes: true,
      maxTables: -1,
      maxWaiters: -1,
      hasMultiBranch: true,
      hasVoucherPrinting: true,
      hasAdvancedReports: true,
      maxBranches: -1,
    },
    features: [
      'Todo lo del plan Premium',
      '✨ Quitar fondo ilimitado',
      '🏬 Multi-sucursal ilimitada',
      '🏬 Mesas y mozos ilimitados por sucursal',
      '🖨️ Voucher printing 1-click (POS 80mm / A4 / A5)',
      '📈 Reportes avanzados: ventas por mozo, plato, sucursal, hora',
      '📱 Panel móvil para mozos (toman comandas desde su celular)',
      '🔄 Transferencia de stock entre sucursales',
      '🔗 Integraciones API (delivery, POS externo)',
      '🎫 Boletas/facturas electrónicas (próximamente)',
      '👑 Soporte prioritario 24/7 + onboarding personalizado',
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

/**
 * Helpers de feature gating para logística premium.
 * Estos se usan en middleware y en UI para bloquear/permitir acciones.
 */
export function hasFeature(planId: string, feature: string): boolean {
  const plan = getPlan(planId);
  const limits = plan.limits as Record<string, unknown>;
  return Boolean(limits[feature]);
}

/**
 * Compara si un plan tiene igual o mayor jerarquía que otro.
 * Jerarquía: free < pro < premium < full
 */
export function isPlanAtLeast(planId: string, minPlan: PlanId): boolean {
  const order: PlanId[] = ['free', 'pro', 'premium', 'full'];
  const currentIdx = order.indexOf((planId as PlanId));
  const minIdx = order.indexOf(minPlan);
  if (currentIdx === -1 || minIdx === -1) return false;
  return currentIdx >= minIdx;
}

export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'premium', 'full'];

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
