import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "SmartKos — Kos Nyaman di Berbagai Kota", template: "%s | SmartKos" },
  description: "Kos bulanan siap huni di Yogyakarta, Jakarta, dan Bandung. Kamar bersih, harga jelas, bayar dari HP.",
};

export const viewport: Viewport = {
  viewportFit: "cover", // agar env(safe-area-inset-*) berlaku di HP berponi
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
