import { CocinaLanding } from './cocina-landing-client';

export const metadata = {
  title: 'Panel de Cocina — MenuPro',
  description: 'Acceso exclusivo para personal de cocina. Ingresa con tu enlace único o QR.',
  robots: { index: false, follow: false },
};

export default function CocinaIndexPage() {
  return <CocinaLanding />;
}
