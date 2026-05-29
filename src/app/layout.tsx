import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DondeEstaciono - Marketplace", template: "%s | DondeEstaciono" },
  description: "Encuentra y gestiona estacionamientos en tiempo real en Chile",
  keywords: ["estacionamiento", "parking", "Chile", "marketplace", "vehículos", "dondestaciono"],
  openGraph: {
    title: "DondeEstaciono",
    description: "Marketplace de estacionamientos en Chile. Ve disponibilidad y precios al instante.",
    type: "website",
    locale: "es_CL",
    siteName: "DondeEstaciono",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🅿️</text></svg>" />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
