import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstacionamientosApp - Marketplace",
  description: "Encuentra y gestiona estacionamientos en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
