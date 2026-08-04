'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { toast } from 'sonner';
import {
  User,
  Building2,
  CreditCard,
  Camera,
  Loader2,
  Save,
  Crown,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  CheckCircle2,
  AlertCircle,
  Receipt,
  X,
  Upload,
  Image as ImageIcon,
  Star,
} from 'lucide-react';
import type { Plan, PlanId } from '@/lib/plans';
import { PLANS } from '@/lib/plans';

interface ProfileData {
  id?: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  logo_url?: string | null;
  plan?: PlanId;
  mp_status?: string | null;
  mp_preapproval_id?: string | null;
  current_period_end?: string | null;
  days_remaining?: number;
  subscription_started_at?: string | null;
  subscription_ended_at?: string | null;
  subscription_cancelled_at?: string | null;
  last_payment_at?: string | null;
  last_payment_amount?: number | null;
  last_payment_currency?: string | null;
  is_trial?: boolean;
  trial_plan?: string | null;
  trial_ends_at?: string | null;
  trial_days_remaining?: number;
  is_demo_account?: boolean;
  is_active?: boolean;
  is_super_admin?: boolean;
  created_at?: string;
  business_name?: string | null;
  business_legal_name?: string | null;
  business_tax_id?: string | null;
  business_phone?: string | null;
  business_whatsapp?: string | null;
  business_address?: string | null;
  business_city?: string | null;
  business_country?: string | null;
  business_postal_code?: string | null;
  business_description?: string | null;
  business_website?: string | null;
  business_hours?: any;
  business_timezone?: string | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_youtube?: string | null;
  social_x?: string | null;
  billing_email?: string | null;
  billing_address?: string | null;
}

interface Props {
  user: { email: string; name: string };
  plan: Plan;
  isSuperAdmin?: boolean;
  profile: ProfileData;
}

const WEEKDAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima',
    });
  } catch {
    return '—';
  }
}

export function AccountClient({ user, plan, isSuperAdmin = false, profile }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState<ProfileData>(profile);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Re-hidratar form cuando cambia profile (ej: después de upload)
  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleChange = useCallback((field: keyof ProfileData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.full_name,
          businessName: form.business_name,
          businessLegalName: form.business_legal_name,
          businessTaxId: form.business_tax_id,
          businessPhone: form.business_phone,
          businessWhatsapp: form.business_whatsapp,
          businessAddress: form.business_address,
          businessCity: form.business_city,
          businessCountry: form.business_country,
          businessPostalCode: form.business_postal_code,
          businessDescription: form.business_description,
          businessWebsite: form.business_website,
          socialFacebook: form.social_facebook,
          socialInstagram: form.social_instagram,
          socialTiktok: form.social_tiktok,
          socialYoutube: form.social_youtube,
          socialX: form.social_x,
          businessHours: form.business_hours,
          billingEmail: form.billing_email,
          billingAddress: form.billing_address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      toast.success('Cambios guardados correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (file: File, type: 'photo' | 'logo') => {
    if (type === 'photo') setUploadingPhoto(true);
    else setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen');

      // Actualizar form
      if (type === 'photo') {
        setForm((prev) => ({ ...prev, photo_url: data.url }));
      } else {
        setForm((prev) => ({ ...prev, logo_url: data.url }));
      }
      toast.success(type === 'photo' ? 'Foto de perfil actualizada' : 'Logo actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      if (type === 'photo') setUploadingPhoto(false);
      else setUploadingLogo(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) handleUploadImage(file, type);
    // Reset input
    e.target.value = '';
  };

  // Estado de suscripción
  const planColor = plan.color || '#d4af37';
  const isPaid = profile.mp_status === 'authorized';
  const isTrial = profile.is_trial === true;
  const isDemo = profile.is_demo_account === true;
  const isCancelled = profile.subscription_cancelled_at !== null;
  const daysRemaining = profile.days_remaining || 0;
  const trialDaysRemaining = profile.trial_days_remaining || 0;

  return (
    <DashboardShell user={user} plan={plan} isSuperAdmin={isSuperAdmin}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
          <UserCircle className="w-7 h-7" />
          Mi Cuenta
        </h1>
        <p className="text-white/60 text-sm sm:text-base">
          Gestiona tu perfil, datos de negocio, suscripción y facturación.
        </p>
      </div>

      {/* ====== SECCIÓN 1: PERFIL + SUSCRIPCIÓN ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Card: Foto + datos básicos */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Perfil
          </h2>

          {/* Foto de perfil */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 flex items-center justify-center">
                {form.photo_url || form.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.photo_url || form.avatar_url || ''}
                    alt="Foto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white/40" />
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#d4af37] text-black flex items-center justify-center hover:bg-[#e5bf4f] transition disabled:opacity-50"
                title="Cambiar foto"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => onFileChange(e, 'photo')}
                className="hidden"
              />
            </div>
            <p className="text-xs text-white/40 mt-2 text-center">
              Foto de perfil (JPG, PNG, WebP, máx 5MB)
            </p>
          </div>

          {/* Nombre completo */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="fullName" className="text-xs text-white/60 mb-1 block">
                Nombre completo
              </Label>
              <Input
                id="fullName"
                value={form.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Tu nombre"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label className="text-xs text-white/60 mb-1 block">Email</Label>
              <div className="text-sm text-white/80 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/5">
                {profile.email}
              </div>
            </div>
            <div>
              <Label className="text-xs text-white/60 mb-1 block">Cuenta creada</Label>
              <div className="text-sm text-white/60 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/5">
                {formatDate(profile.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Card: Suscripción */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Crown className="w-5 h-5" style={{ color: planColor }} />
              Suscripción
            </h2>
            {isDemo && (
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                CUENTA DEMO
              </span>
            )}
          </div>

          {/* Estado actual */}
          <div
            className="rounded-xl p-5 mb-5"
            style={{
              background: `linear-gradient(135deg, ${planColor}15, transparent)`,
              border: `1px solid ${planColor}40`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-white/60 uppercase tracking-wide">Plan actual</div>
                <div className="text-2xl font-bold mt-1" style={{ color: planColor }}>
                  {plan.name}
                </div>
              </div>
              <div className="text-right">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/40">
                    <CheckCircle2 className="w-3 h-3" /> Activo
                  </span>
                ) : isTrial ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    <Clock className="w-3 h-3" /> Prueba gratuita
                  </span>
                ) : isCancelled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                    <AlertCircle className="w-3 h-3" /> Cancelado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/60 border border-white/10">
                    Inactivo
                  </span>
                )}
              </div>
            </div>

            {/* Grid de datos de suscripción */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-white/50 mb-1">Precio</div>
                <div className="font-semibold">
                  {plan.priceMonthly === 0 ? 'Gratis' : `S/ ${plan.priceMonthly}/mes`}
                </div>
              </div>
              <div>
                <div className="text-white/50 mb-1">Estado MP</div>
                <div className="font-semibold">
                  {profile.mp_status ? (
                    <span className={isPaid ? 'text-green-400' : 'text-orange-400'}>
                      {profile.mp_status}
                    </span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-white/50 mb-1">Días restantes</div>
                <div className="font-semibold">
                  {isTrial ? trialDaysRemaining : daysRemaining} días
                </div>
              </div>
              <div>
                <div className="text-white/50 mb-1">
                  {isTrial ? 'Fin del trial' : 'Próximo cobro'}
                </div>
                <div className="font-semibold">
                  {formatDate(isTrial ? profile.trial_ends_at : profile.current_period_end)}
                </div>
              </div>
              <div>
                <div className="text-white/50 mb-1">Suscripción iniciada</div>
                <div className="font-semibold">{formatDate(profile.subscription_started_at)}</div>
              </div>
              <div>
                <div className="text-white/50 mb-1">Último pago</div>
                <div className="font-semibold">
                  {profile.last_payment_amount ? (
                    <>
                      {profile.last_payment_currency === 'PEN' ? 'S/' : '$'}
                      {profile.last_payment_amount.toFixed(2)} · {formatDate(profile.last_payment_at)}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>

            {/* Aviso de trial con horas extras */}
            {isTrial && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs">
                <Clock className="w-4 h-4 inline mr-2" />
                Estás en período de prueba gratuito. Te quedan <strong>{trialDaysRemaining} días</strong>.
                El sistema expira pruebas diariamente a la 1 AM (hora Perú), pero tienes un margen de
                <strong> horas extras</strong> hasta que verdaderamente se acabe el período.
              </div>
            )}

            {/* Aviso de cancelación */}
            {isCancelled && profile.current_period_end && (
              <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Cancelaste tu suscripción. Conservas acceso al plan <strong>{plan.name}</strong> hasta el{' '}
                <strong>{formatDate(profile.current_period_end)}</strong>. Luego pasarás automáticamente a Free.
              </div>
            )}

            {/* Botones de acción */}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                onClick={() => (window.location.href = '/dashboard/billing')}
                className="text-xs"
                style={{ background: planColor, color: '#0a0a14' }}
              >
                <CreditCard className="w-3.5 h-3.5 mr-2" />
                {profile.plan === 'free' ? 'Ver planes' : 'Gestionar suscripción'}
              </Button>
              {profile.mp_preapproval_id && (
                <a
                  href={`https://www.mercadopago.com.pe/subscriptions/summary?preapproval_id=${profile.mp_preapproval_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 transition"
                >
                  Ver en MercadoPago →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====== SECCIÓN 2: DATOS DEL NEGOCIO ====== */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Datos del negocio
        </h2>

        {/* Logo */}
        <div className="flex flex-col sm:flex-row gap-4 items-start mb-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/5 border-2 border-white/10 flex items-center justify-center">
              {form.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-white/40" />
              )}
            </div>
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 transition disabled:opacity-50 flex items-center gap-1"
            >
              {uploadingLogo ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              Subir logo
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onFileChange(e, 'logo')}
              className="hidden"
            />
          </div>
          <div className="flex-1 w-full">
            <Label htmlFor="businessDescription" className="text-xs text-white/60 mb-1 block">
              Descripción del negocio
            </Label>
            <Textarea
              id="businessDescription"
              value={form.business_description || ''}
              onChange={(e) => handleChange('business_description', e.target.value)}
              placeholder="Ej: Pollería al carbón desde 1998. Especialidad en pollos a la brasa con adobo secreto de la casa."
              className="bg-white/5 border-white/10 min-h-[80px]"
              maxLength={500}
            />
            <div className="text-[10px] text-white/40 mt-1 text-right">
              {(form.business_description || '').length}/500
            </div>
          </div>
        </div>

        {/* Grid de campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName" className="text-xs text-white/60 mb-1 block">
              Nombre comercial
            </Label>
            <Input
              id="businessName"
              value={form.business_name || ''}
              onChange={(e) => handleChange('business_name', e.target.value)}
              placeholder="Pollería Don Tito"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="businessLegalName" className="text-xs text-white/60 mb-1 block">
              Razón social
            </Label>
            <Input
              id="businessLegalName"
              value={form.business_legal_name || ''}
              onChange={(e) => handleChange('business_legal_name', e.target.value)}
              placeholder="Inversiones Don Tito SAC"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="businessTaxId" className="text-xs text-white/60 mb-1 block">
              RUC / DNI
            </Label>
            <Input
              id="businessTaxId"
              value={form.business_tax_id || ''}
              onChange={(e) => handleChange('business_tax_id', e.target.value)}
              placeholder="20512345678"
              className="bg-white/5 border-white/10"
              maxLength={20}
            />
          </div>
          <div>
            <Label htmlFor="businessPhone" className="text-xs text-white/60 mb-1 block">
              <Phone className="w-3 h-3 inline mr-1" />
              Teléfono
            </Label>
            <Input
              id="businessPhone"
              value={form.business_phone || ''}
              onChange={(e) => handleChange('business_phone', e.target.value)}
              placeholder="+51 1 234-5678"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="businessWhatsapp" className="text-xs text-white/60 mb-1 block">
              WhatsApp (con código país)
            </Label>
            <Input
              id="businessWhatsapp"
              value={form.business_whatsapp || ''}
              onChange={(e) => handleChange('business_whatsapp', e.target.value)}
              placeholder="51987654321"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="businessWebsite" className="text-xs text-white/60 mb-1 block">
              <Globe className="w-3 h-3 inline mr-1" />
              Sitio web
            </Label>
            <Input
              id="businessWebsite"
              value={form.business_website || ''}
              onChange={(e) => handleChange('business_website', e.target.value)}
              placeholder="https://mit_negocio.com"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="businessAddress" className="text-xs text-white/60 mb-1 block">
              <MapPin className="w-3 h-3 inline mr-1" />
              Dirección
            </Label>
            <Input
              id="businessAddress"
              value={form.business_address || ''}
              onChange={(e) => handleChange('business_address', e.target.value)}
              placeholder="Av. Principal 123"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="businessCity" className="text-xs text-white/60 mb-1 block">
              Ciudad
            </Label>
            <Input
              id="businessCity"
              value={form.business_city || ''}
              onChange={(e) => handleChange('business_city', e.target.value)}
              placeholder="Lima"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="businessCountry" className="text-xs text-white/60 mb-1 block">
              País
            </Label>
            <Input
              id="businessCountry"
              value={form.business_country || ''}
              onChange={(e) => handleChange('business_country', e.target.value)}
              placeholder="Perú"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="businessPostalCode" className="text-xs text-white/60 mb-1 block">
              Código postal
            </Label>
            <Input
              id="businessPostalCode"
              value={form.business_postal_code || ''}
              onChange={(e) => handleChange('business_postal_code', e.target.value)}
              placeholder="15001"
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>

      {/* ====== SECCIÓN 3: REDES SOCIALES ====== */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Instagram className="w-5 h-5" />
          Redes sociales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="socialFacebook" className="text-xs text-white/60 mb-1 block">
              <Facebook className="w-3 h-3 inline mr-1" />
              Facebook (URL o usuario)
            </Label>
            <Input
              id="socialFacebook"
              value={form.social_facebook || ''}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="facebook.com/minegocio"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="socialInstagram" className="text-xs text-white/60 mb-1 block">
              <Instagram className="w-3 h-3 inline mr-1" />
              Instagram (@usuario)
            </Label>
            <Input
              id="socialInstagram"
              value={form.social_instagram || ''}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              placeholder="@minegocio"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="socialTiktok" className="text-xs text-white/60 mb-1 block">
              TikTok (@usuario)
            </Label>
            <Input
              id="socialTiktok"
              value={form.social_tiktok || ''}
              onChange={(e) => handleChange('social_tiktok', e.target.value)}
              placeholder="@minegocio"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="socialYoutube" className="text-xs text-white/60 mb-1 block">
              <Youtube className="w-3 h-3 inline mr-1" />
              YouTube (URL)
            </Label>
            <Input
              id="socialYoutube"
              value={form.social_youtube || ''}
              onChange={(e) => handleChange('social_youtube', e.target.value)}
              placeholder="youtube.com/@minegocio"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="socialX" className="text-xs text-white/60 mb-1 block">
              X / Twitter (@usuario)
            </Label>
            <Input
              id="socialX"
              value={form.social_x || ''}
              onChange={(e) => handleChange('social_x', e.target.value)}
              placeholder="@minegocio"
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>

      {/* ====== SECCIÓN 4: DATOS DE FACTURACIÓN ====== */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Datos de facturación
        </h2>
        <p className="text-xs text-white/50 mb-4">
          Los recibos mensuales se enviarán a este email. Si necesitas factura electrónica,
          asegúrate de completar razón social + RUC arriba.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="billingEmail" className="text-xs text-white/60 mb-1 block">
              Email para facturación
            </Label>
            <Input
              id="billingEmail"
              type="email"
              value={form.billing_email || ''}
              onChange={(e) => handleChange('billing_email', e.target.value)}
              placeholder={profile.email}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label htmlFor="billingAddress" className="text-xs text-white/60 mb-1 block">
              Dirección de facturación
            </Label>
            <Input
              id="billingAddress"
              value={form.billing_address || ''}
              onChange={(e) => handleChange('billing_address', e.target.value)}
              placeholder="Av. Principal 123, Lima"
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>

      {/* ====== Botón Guardar (sticky) ====== */}
      <div className="sticky bottom-20 lg:bottom-4 z-30">
        <div className="bg-[#0a0a14]/90 backdrop-blur border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="text-xs text-white/60 hidden sm:block">
            Recuerda guardar tus cambios al finalizar la edición.
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto"
            style={{ background: planColor, color: '#0a0a14' }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Espaciado extra en mobile para que el sticky no tape contenido */}
      <div className="h-16 lg:h-0" />
    </DashboardShell>
  );
}
