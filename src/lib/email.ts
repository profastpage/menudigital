/**
 * Cliente de email transaccional con Resend.
 *
 * Si RESEND_API_KEY está configurado, envía emails vía Resend.
 * Si no, hace log del email que se hubiera enviado (modo dev).
 *
 * Configuración:
 * 1. Crea cuenta en https://resend.com (tier free: 3000 emails/mes)
 * 2. Verifica tu dominio (menudigital.pro) en Resend → Domains
 * 3. Copia RESEND_API_KEY en Vercel → Settings → Environment Variables
 * 4. (Opcional) FROM_EMAIL=MenuPro <hola@menudigital.pro>
 *    Si no configuras dominio propio, usa onboarding@resend.dev (sandbox)
 */

import { Resend } from 'resend';

let _client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (_client) return _client;
  _client = new Resend(apiKey);
  return _client;
}

export const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  (process.env.NODE_ENV === 'production'
    ? 'MenuPro <onboarding@resend.dev>'
    : 'MenuPro Dev <onboarding@resend.dev>');

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Plain text version (optional but recommended) */
  text?: string;
  /** Reply-to address */
  replyTo?: string;
  /** Tags for filtering in Resend dashboard */
  tags?: string[];
}

/**
 * Envía un email transaccional.
 *
 * En desarrollo (sin RESEND_API_KEY), hace log en vez de enviar.
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const client = getClient();

  if (!client) {
    console.log(
      '[email] MODO DEV — RESEND_API_KEY no configurado. Email que se hubiera enviado:'
    );
    console.log('  To:      ', params.to);
    console.log('  Subject: ', params.subject);
    console.log('  Body:    ', params.text || '(HTML only)');
    return { success: true, id: 'dev-mode' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      tags: params.tags?.map((name) => ({ name, value: 'true' })),
    });

    if (error) {
      console.error('[email] Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[email] Excepción al enviar:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}
