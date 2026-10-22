import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { ListingExplorer } from "@/components/listing-explorer";
import { Heading } from "@/components/heading";
import { getRoomListings } from "@/lib/public-api";

export const metadata: Metadata = { title: "Cari Kamar" };

export default async function KamarPage() {
  const rooms = await getRoomListings();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <Heading as="h1" light="Temukan kamar yang" bold="pas buat kamu" />
            <p className="mt-3 max-w-lg text-muted">Semua tipe kamar dari seluruh cabang SmartKos, lengkap dengan harga dan sisa kamar.</p>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Suspense>
            <ListingExplorer rooms={rooms} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
