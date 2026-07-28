/**
 * Templates HTML para emails transaccional.
 *
 * Cada template es una función que retorna HTML string.
 * Estilo: dark theme premium con acentos dorados, consistente con
 * el branding del dashboard.
 */

const BASE_STYLES = `
  background: #07070b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #ffffff;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
`.replace(/\s+/g, ' ').trim();

const WRAPPER = `
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 24px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://menudigital.pro/logo-192.webp" alt="MenuPro" width="48" height="48" style="border-radius: 8px;" />
      <h1 style="margin: 16px 0 4px 0; font-size: 22px; font-weight: 700;">MenuPro</h1>
    </div>
  </div>
`;

const FOOTER = `
  <div style="max-width: 560px; margin: 0 auto; padding: 24px; text-align: center; color: rgba(255,255,255,0.4); font-size: 12px; line-height: 1.6;">
    <p>© ${new Date().getFullYear()} MenuPro · FastPagePro · Lima, Perú</p>
    <p>
      <a href="https://menudigital.pro/legal/terminos" style="color: rgba(255,255,255,0.6); text-decoration: none;">Términos</a> ·
      <a href="https://menudigital.pro/legal/privacidad" style="color: rgba(255,255,255,0.6); text-decoration: none;">Privacidad</a> ·
      <a href="https://menudigital.pro/legal/reembolsos" style="color: rgba(255,255,255,0.6); text-decoration: none;">Reembolsos</a>
    </p>
    <p style="margin-top: 12px;">
      ¿Necesitas ayuda? <a href="mailto:soporte@menudigital.pro" style="color: #d4af37; text-decoration: none;">soporte@menudigital.pro</a>
    </p>
  </div>
`;

interface EmailTemplateData {
  fullName?: string;
  email: string;
}

export interface WelcomeEmailData extends EmailTemplateData {
  plan: 'free' | 'pro' | 'full' | 'premium';
  dashboardUrl: string;
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const planNames: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    premium: 'Premium',
    full: 'FULL',
  };

  const planName = planNames[data.plan] || 'Free';
  const firstName = (data.fullName || '').split(' ')[0] || 'chef';

  return {
    subject: `¡Bienvenido a MenuPro ${planName}, ${firstName}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html><body style="${BASE_STYLES}">
        ${WRAPPER}
        <div style="max-width: 560px; margin: 0 auto; padding: 0 24px 32px;">
          <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">¡Hola, ${firstName}! 👋</h2>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 16px 0;">
            Tu cuenta MenuPro <strong style="color: #d4af37;">${planName}</strong> está lista.
            Ya puedes crear tu primera carta digital, generar códigos QR para las mesas
            y empezar a recibir pedidos por WhatsApp.
          </p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 24px 0;">
            Esto es lo que te recomendamos hacer primero:
          </p>
          <ul style="color: rgba(255,255,255,0.7); line-height: 1.8; padding-left: 20px; margin: 0 0 24px 0;">
            <li>Crea tu primer menú y agrega 5-10 productos</li>
            <li>Personaliza el tema (claro/oscuro, colores, fuentes)</li>
            <li>Genera el QR y compártelo en tus mesas</li>
            <li>Activa el módulo de mozos si tu plan lo incluye</li>
          </ul>
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #d4af37, #f4d35e); color: #1a1a2e; font-weight: 600; text-decoration: none; border-radius: 8px;">
            Entrar a mi panel
          </a>
        </div>
        ${FOOTER}
      </body></html>
    `,
    text: `¡Hola ${firstName}!

Tu cuenta MenuPro ${planName} está lista. Ya puedes crear tu primera carta digital, generar códigos QR para las mesas y empezar a recibir pedidos por WhatsApp.

Esto es lo que te recomendamos hacer primero:
- Crea tu primer menú y agrega 5-10 productos
- Personaliza el tema (claro/oscuro, colores, fuentes)
- Genera el QR y compártelo en tus mesas
- Activa el módulo de mozos si tu plan lo incluye

Entra a tu panel: ${data.dashboardUrl}

— Equipo MenuPro`,
  };
}

export interface PaymentConfirmedEmailData extends EmailTemplateData {
  plan: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
  invoiceUrl?: string;
}

export function paymentConfirmedEmail(data: PaymentConfirmedEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Pago confirmado — Plan ${data.plan} activo ✅`,
    html: `
      <!DOCTYPE html>
      <html><body style="${BASE_STYLES}">
        ${WRAPPER}
        <div style="max-width: 560px; margin: 0 auto; padding: 0 24px 32px;">
          <div style="background: rgba(6, 214, 160, 0.1); border: 1px solid rgba(6, 214, 160, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
            <h2 style="color: #06d6a0; margin: 0; font-size: 18px;">Pago confirmado</h2>
          </div>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 16px 0;">
            Hola ${(data.fullName || '').split(' ')[0] || 'cliente'}, tu suscripción a MenuPro ${data.plan} está activa.
          </p>
          <table style="width: 100%; color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 24px 0;">
            <tr><td style="padding: 8px 0; color: rgba(255,255,255,0.5);">Plan:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.plan}</td></tr>
            <tr><td style="padding: 8px 0; color: rgba(255,255,255,0.5);">Monto:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.currency} ${data.amount.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: rgba(255,255,255,0.5);">Próximo cobro:</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.nextBillingDate}</td></tr>
          </table>
          ${data.invoiceUrl ? `<p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 16px 0;"><a href="${data.invoiceUrl}" style="color: #d4af37;">Ver factura en MercadoPago →</a></p>` : ''}
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 24px 0;">
            Tienes acceso completo a todas las funcionalidades de tu plan.
            ¡A aprovecharlas!
          </p>
        </div>
        ${FOOTER}
      </body></html>
    `,
    text: `Pago confirmado — Plan ${data.plan}

Hola ${(data.fullName || '').split(' ')[0] || 'cliente'},

Tu suscripción a MenuPro ${data.plan} está activa.

• Plan: ${data.plan}
• Monto: ${data.currency} ${data.amount.toFixed(2)}
• Próximo cobro: ${data.nextBillingDate}

Tienes acceso completo a todas las funcionalidades de tu plan.

— Equipo MenuPro`,
  };
}

export interface PaymentFailedEmailData extends EmailTemplateData {
  plan: string;
  retryUrl: string;
}

export function paymentFailedEmail(data: PaymentFailedEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `No pudimos cobrar tu suscripción a MenuPro ⚠️`,
    html: `
      <!DOCTYPE html>
      <html><body style="${BASE_STYLES}">
        ${WRAPPER}
        <div style="max-width: 560px; margin: 0 auto; padding: 0 24px 32px;">
          <div style="background: rgba(255, 159, 28, 0.1); border: 1px solid rgba(255, 159, 28, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="font-size: 32px; margin-bottom: 8px; text-align: center;">⚠️</div>
            <h2 style="color: #ff9f1c; margin: 0; font-size: 18px; text-align: center;">Pago pendiente</h2>
          </div>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 16px 0;">
            Hola ${(data.fullName || '').split(' ')[0] || 'cliente'}, intentamos cobrar tu suscripción a MenuPro ${data.plan} pero la transacción fue rechazada por tu banco o tarjeta.
          </p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 24px 0;">
            No te preocupes, tu cuenta sigue activa durante 7 días de gracia. Por favor actualiza tu método de pago:
          </p>
          <a href="${data.retryUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #d4af37, #f4d35e); color: #1a1a2e; font-weight: 600; text-decoration: none; border-radius: 8px;">
            Actualizar método de pago
          </a>
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; line-height: 1.6; margin-top: 24px;">
            Si crees que es un error o necesitas ayuda, contáctanos a soporte@menudigital.pro
          </p>
        </div>
        ${FOOTER}
      </body></html>
    `,
    text: `No pudimos cobrar tu suscripción a MenuPro ${data.plan}

Hola ${(data.fullName || '').split(' ')[0] || 'cliente'},

Intentamos cobrar tu suscripción pero la transacción fue rechazada por tu banco o tarjeta.

No te preocupes, tu cuenta sigue activa durante 7 días de gracia. Por favor actualiza tu método de pago:

${data.retryUrl}

Si necesitas ayuda: soporte@menudigital.pro

— Equipo MenuPro`,
  };
}

export interface TrialEndingEmailData extends EmailTemplateData {
  daysLeft: number;
  dashboardUrl: string;
}

export function trialEndingEmail(data: TrialEndingEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Tu garantía de 7 días termina en ${data.daysLeft} día${data.daysLeft === 1 ? '' : 's'}`,
    html: `
      <!DOCTYPE html>
      <html><body style="${BASE_STYLES}">
        ${WRAPPER}
        <div style="max-width: 560px; margin: 0 auto; padding: 0 24px 32px;">
          <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">Tu garantía está por terminar</h2>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 16px 0;">
            Hola ${(data.fullName || '').split(' ')[0] || 'cliente'}, te quedan <strong style="color: #d4af37;">${data.daysLeft} día${data.daysLeft === 1 ? '' : 's'}</strong> de garantía de satisfacción de 7 días.
          </p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 24px 0;">
            Si MenuPro no es para ti, puedes solicitar el reembolso del 100% sin preguntas. Si te está funcionando, no necesitas hacer nada — tu suscripción continuará normalmente.
          </p>
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #d4af37, #f4d35e); color: #1a1a2e; font-weight: 600; text-decoration: none; border-radius: 8px;">
            Ver mi suscripción
          </a>
        </div>
        ${FOOTER}
      </body></html>
    `,
    text: `Tu garantía está por terminar

Hola ${(data.fullName || '').split(' ')[0] || 'cliente'},

Te quedan ${data.daysLeft} día${data.daysLeft === 1 ? '' : 's'} de garantía de satisfacción de 7 días.

Si MenuPro no es para ti, puedes solicitar el reembolso del 100% sin preguntas. Si te está funcionando, no necesitas hacer nada — tu suscripción continuará normalmente.

Ver mi suscripción: ${data.dashboardUrl}

— Equipo MenuPro`,
  };
}
