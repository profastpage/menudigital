import Link from 'next/link';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Pricing } from '@/components/landing/pricing';
import { FAQ } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#07070b] text-white">
      <header className="border-b border-white/5 backdrop-blur sticky top-0 z-50 bg-[#07070b]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-lg font-bold text-[#1a1a2e]">
              M
            </div>
            <span className="font-bold text-lg">MenuPro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Precios</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white px-3 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
