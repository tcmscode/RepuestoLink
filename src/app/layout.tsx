import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/providers/Toaster";

export const metadata: Metadata = {
  title: "RepuestoLink — Marketplace B2B de repuestos pesados",
  description:
    "RepuestoLink conecta distribuidoras con flotas y talleres. Anonimato, cuatro listas de precio, comisión 2%.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
