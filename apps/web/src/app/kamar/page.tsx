import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { ListingExplorer } from "@/components/listing-explorer";
import { Ornament } from "@/components/landing/ornament";
import { getRoomListings } from "@/lib/public-api";

export const metadata: Metadata = { title: "Cari Kamar" };

export default async function KamarPage() {
  const rooms = await getRoomListings();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-night text-white">
      <SiteHeader night />
      {/* overflow-x-clip (bukan hidden) agar bar filter sticky di HP tetap jalan */}
      <main className="relative flex-1 overflow-x-clip">
        <section className="relative">
          <Ornament className="absolute -right-10 -top-4 w-52 rotate-12" />
          <div className="pointer-events-none absolute -left-40 -top-24 size-[420px] rounded-full bg-brand-600/25 blur-3xl motion-safe:animate-drift" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:py-16 lg:text-left">
            <h1 className="text-balance text-[2.1rem] font-bold leading-[1.2] tracking-tight sm:text-5xl">
              Temukan kamar yang <span className="text-lime">pas buat kamu</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-white/65 lg:mx-0">Semua tipe kamar dari seluruh cabang SmartKos, lengkap dengan harga dan sisa kamar.</p>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
          <Suspense>
            <ListingExplorer rooms={rooms} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
