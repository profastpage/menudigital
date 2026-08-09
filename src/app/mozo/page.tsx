import { MozoLanding } from './mozo-landing-client';

export const metadata = {
  title: 'Panel del Mozo — MenuPro',
  description: 'Acceso exclusivo para mozos. Ingresa con tu enlace único o QR.',
  robots: { index: false, follow: false },
};

export default function MozoIndexPage() {
  return <MozoLanding />;
}
