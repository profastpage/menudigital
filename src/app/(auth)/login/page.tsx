import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const redirectTo = params.redirect || '/dashboard';

  return (
    <main className="min-h-screen flex">
      {/* Hero izquierda */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#07070b]">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: '#d4af37' }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: '#9d4edd' }}
        />
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-2xl font-bold text-[#1a1a2e] shadow-lg shadow-[#d4af37]/30">
              M
            </div>
            <span className="text-2xl font-bold">MenuPro</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Menús digitales
            <br />
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] bg-clip-text text-transparent">
              que venden más
            </span>
          </h1>
          <p className="text-lg text-white/70 mb-12 max-w-md">
            Crea tu carta digital con carrito integrado de WhatsApp en minutos.
            Sin comisiones por venta. Sin contratos.
          </p>
          <div className="space-y-4">
            {[
              'Editor visual arrastrar y soltar',
              'Código QR para tus mesas',
              'URL pública personalizada',
              'Cobro directo por WhatsApp',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[10px] text-[#d4af37]">
                  ✓
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form derecha */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#07070b]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-xl font-bold text-[#1a1a2e]">
              M
            </div>
            <span className="text-xl font-bold text-white">MenuPro</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Bienvenido</h2>
          <p className="text-white/60 mb-8">Inicia sesión en tu cuenta</p>

          <LoginForm redirect={redirectTo} />
        </div>
      </div>
    </main>
  );
}
