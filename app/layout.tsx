import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { InstallPWA } from "@/components/install-pwa";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { TenantThemeProvider } from "@/components/tenant-theme-provider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de Gimnasio",
  description: "Plataforma integral de gestión y entrenamiento para Boxes y Gimnasios",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gimnasio",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "DevGym | Gestión y Entrenamiento para Gimnasios y Boxes",
    description: "Plataforma integral de gestión, reservas y entrenamientos para Boxes y Gimnasios.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#09090b" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <TenantThemeProvider />
        <AuthProvider>
          {children}
          <InstallPWA />
          <Toaster />
          <Analytics />
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
