import { Hero } from "@/components/landing/hero";
import { TrustBar } from '@/components/landing/trust-bar';
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { LandingHeader } from "@/components/landing/landing-header";
import { SupportWhatsAppButton } from "@/components/support/support-whatsapp-button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#07070b] text-white">
      <ScrollProgress />
      <LandingHeader />

      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <ComparisonTable />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />

      {/* Botón flotante de WhatsApp — soporte ventas para visitantes */}
      <SupportWhatsAppButton variant="landing" />
    </main>
  );
}
