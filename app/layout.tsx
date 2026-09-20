import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Intense Fitness",
    template: "%s · Intense Fitness",
  },
  description: "Agenda e gerenciamento do Intense Fitness",
  applicationName: "Intense Fitness",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Intense Fitness",
  },
  formatDetection: { telephone: true },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

// Ajustes específicos do iPhone: área segura (safe area) na barra de status
// e visual de "app nativo" quando instalado na tela de início.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

import { ToastContainer } from "@/components/toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}