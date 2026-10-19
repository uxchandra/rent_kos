import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingExplorer } from "@/components/listing-explorer";
import { KosCard } from "@/components/kos-card";
import { Faq } from "@/components/faq";
import { getKosList, getRoomListings } from "@/lib/public-api";

export default async function HomePage() {
  const [rooms, kosList] = await Promise.all([getRoomListings(), getKosList()]);

  return (
    <>
      <SiteHeader />

      <main id="kamar" className="flex-1">
        <h1 className="sr-only">SmartKos — kos bulanan di {kosList.map((k) => k.city).join(", ")}</h1>
        <ListingExplorer rooms={rooms} />

        <section className="mx-auto max-w-350 px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold">Jelajahi cabang SmartKos</h2>
          <p className="mt-1 text-muted">Setiap cabang punya halaman sendiri lengkap dengan denah lokasi dan peraturan kos.</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kosList.map((kos) => (
              <KosCard key={kos.id} kos={kos} />
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto grid max-w-350 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-2xl font-semibold">Pertanyaan umum</h2>
              <p className="mt-2 text-muted">Seputar sewa, deposit, dan pembayaran di SmartKos.</p>
            </div>
            <Faq />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
