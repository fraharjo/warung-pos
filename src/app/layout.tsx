import type { Metadata, Viewport } from "next";
import { getDb } from "@/lib/db";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  let storeName = "Ayam Bakar Spesial";
  try {
    const settings = await getDb().getSettings();
    if (settings.storeName?.trim()) {
      storeName = settings.storeName;
    }
  } catch {
    // Fallback during static analysis / unavailable DB
  }

  return {
    title: `${storeName} — Kasir POS & Stok`,
    description:
      "Aplikasi kasir POS untuk mencatat pesanan, hitung kembalian, cetak struk thermal 58mm, dan melacak stok ayam bakar.",
    manifest: "/manifest.json",
  };
}

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
