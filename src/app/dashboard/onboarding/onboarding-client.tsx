'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Store, Utensils, ChefHat, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'polleria', label: 'Pollería' },
  { value: 'chifa', label: 'Chifa' },
  { value: 'pizzeria', label: 'Pizzería' },
  { value: 'burgers', label: 'Burgers' },
  { value: 'cevicheria', label: 'Cevichería' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'bakery', label: 'Panadería' },
  { value: 'bar', label: 'Bar / Cantina' },
  { value: 'otro', label: 'Otro' },
];

const COLOR_PRESETS = [
  '#ff6b35', // orange
  '#dc2626', // red
  '#d4af37', // gold
  '#16a34a', // green
  '#0891b2', // cyan
  '#7c3aed', // purple
  '#1e293b', // slate dark
  '#e11d48', // pink
];

interface OnboardingClientProps {
  userEmail: string;
  defaultName?: string;
}

export function OnboardingClient({ userEmail, defaultName }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Paso 1: Datos del negocio
  const [businessName, setBusinessName] = useState(defaultName || '');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Paso 2: Datos del menú
  const [menuName, setMenuName] = useState('');
  const [menuSlogan, setMenuSlogan] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  // Paso 3: Primer plato
  const [categoryName, setCategoryName] = useState('');
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');

  const inputCls =
    'h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4af37] focus:ring-[#d4af37]/20 transition';

  function handleNext() {
    if (step === 1) {
      if (!businessName.trim()) {
        toast.error('El nombre del negocio es obligatorio');
        return;
      }
      setMenuName(menuName || businessName);
      setStep(2);
    } else if (step === 2) {
      if (!menuName.trim() || !whatsapp.trim()) {
        toast.error('Nombre del menú y WhatsApp son obligatorios');
        return;
      }
      setStep(3);
    }
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  async function handleSubmit() {
    if (!categoryName.trim() || !dishName.trim() || !dishPrice) {
      toast.error('Completa todos los campos del plato');
      return;
    }

    const price = parseFloat(dishPrice);
    if (isNaN(price) || price < 0) {
      toast.error('El precio debe ser un número válido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          phone,
          businessType,
          menuName,
          menuSlogan,
          whatsapp,
          color,
          categoryName,
          dishName,
          dishPrice: price,
          dishDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error desconocido');
      }

      toast.success('¡Menú creado! Redirigiendo al editor...');
      router.push(data.redirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear menú');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07070b] text-white">
      {/* Header simple */}
      <header className="border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <picture>
              <source srcSet="/logo-192.webp" type="image/webp" />
              <img src="/logo-192.png" alt="MenuPro" width={32} height={32} className="rounded-lg" />
            </picture>
            <span className="font-bold">MenuPro</span>
          </div>
          <span className="text-xs text-white/40">Configuración inicial</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                  step >= s
                    ? 'bg-gradient-to-br from-[#d4af37] to-[#f4d35e] text-[#1a1a2e]'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition ${
                    step > s ? 'bg-[#d4af37]' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Datos del negocio */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-6 h-6 text-[#d4af37]" />
                <h1 className="text-2xl font-bold">Cuéntanos de tu negocio</h1>
              </div>
              <p className="text-white/60 text-sm">
                Estos datos nos ayudan a personalizar tu experiencia y aparecen en tu factura.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Nombre del negocio *</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej: Pollería El Dorado"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Teléfono (opcional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Rubro</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setBusinessType(bt.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm transition ${
                        businessType === bt.value
                          ? 'bg-[#d4af37] text-[#1a1a2e] font-semibold'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-semibold hover:opacity-90 h-12 px-6"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Datos del menú */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Utensils className="w-6 h-6 text-[#d4af37]" />
                <h1 className="text-2xl font-bold">Crea tu primer menú</h1>
              </div>
              <p className="text-white/60 text-sm">
                La carta digital que tus clientes verán al escanear el QR.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Nombre del menú *</Label>
                <Input
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="Ej: Carta El Dorado"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Slogan (opcional)</Label>
                <Input
                  value={menuSlogan}
                  onChange={(e) => setMenuSlogan(e.target.value)}
                  placeholder="Ej: El sabor del Perú"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">WhatsApp del negocio *</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="51987654321"
                  className={inputCls}
                />
                <p className="text-xs text-white/40">
                  Con código de país, sin + ni espacios. Los pedidos llegarán a este número.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Color principal</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-lg transition ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#07070b]' : ''
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-semibold hover:opacity-90 h-12 px-6"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Primer plato */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="w-6 h-6 text-[#d4af37]" />
                <h1 className="text-2xl font-bold">Agrega tu primer plato</h1>
              </div>
              <p className="text-white/60 text-sm">
                Puedes agregar más platos después en el editor. Esto es solo para arrancar.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Categoría *</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ej: Pollos a la brasa"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Nombre del plato *</Label>
                <Input
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="Ej: Pollo a la brasa entero"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Precio (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dishPrice}
                  onChange={(e) => setDishPrice(e.target.value)}
                  placeholder="42.00"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Descripción (opcional)</Label>
                <Input
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Pollo a la brasa con papas fritas, ensalada y salsas de la casa"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-semibold hover:opacity-90 h-12 px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Crear mi menú
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Hint al final */}
        <p className="text-center text-xs text-white/40 mt-12">
          ¿Necesitas ayuda?{' '}
          <a
            href="https://wa.me/51987654321"
            target="_blank"
            rel="noreferrer"
            className="text-[#d4af37] hover:underline"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      </div>
    </main>
  );
}
