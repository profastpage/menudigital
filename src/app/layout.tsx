import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MenuPro — Menús digitales profesionales con WhatsApp",
  description:
    "Crea tu carta digital con carrito integrado de WhatsApp en minutos. Sin comisiones por venta. Hecho en Perú para restaurantes peruanos.",
  keywords: [
    "menú digital",
    "carta digital",
    "WhatsApp",
    "restaurante",
    "Perú",
    "QR",
    "MenuPro",
  ],
  authors: [{ name: "MenuPro" }],
  openGraph: {
    title: "MenuPro — Menús digitales profesionales",
    description:
      "Crea tu carta digital con WhatsApp en minutos. Sin comisiones por venta.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuPro",
    description: "Menús digitales profesionales con WhatsApp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-[#07070b] text-white min-h-screen`}
      >
        {children}
        <SonnerToaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
