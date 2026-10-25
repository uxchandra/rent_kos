import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft, CreditCard, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { KosCard } from "@/components/kos-card";
import { GalleryGrid } from "@/components/gallery";
import { PhotoCarousel } from "@/components/photo-carousel";
import { BookingCard, MobileBookingBar } from "@/components/booking-card";
import { getKosBySlug, getKosList } from "@/lib/public-api";
import { genderLabel, price, waLink } from "@/lib/format";
import { facilityIcon, placeIcon } from "@/lib/icons";
import { tierOf } from "@/lib/tiers";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const kos = await getKosBySlug((await params).slug);
  if (!kos) return { title: "Kos tidak ditemukan" };
  return { title: `${kos.name}, ${kos.city}`, description: kos.tagline ?? undefined };
}

export default async function KosPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const [kos, allKos] = await Promise.all([getKosBySlug(slug), getKosList()]);
  if (!kos) notFound();

  const others = allKos.filter((k) => k.slug !== kos.slug);
  const minPrice = kos.roomTypes.length ? Math.min(...kos.roomTypes.map((t) => t.monthlyPrice)) : null;
  const total = kos.roomTypes.reduce((s, t) => s + t.totalRooms, 0);
  const available = kos.roomTypes.reduce((s, t) => s + t.availableRooms, 0);
  const district = kos.address.split(",").slice(-2).join(",").trim();
  const photos = [...(kos.coverImage ? [{ url: kos.coverImage, caption: kos.name }] : []), ...kos.photos];
  const nearest = kos.nearby?.[0];
  const hasCoords = kos.latitude !== null && kos.longitude !== null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${kos.latitude},${kos.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kos.address)}`;
  const rules = kos.rules?.split("\n").filter(Boolean) ?? [];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-night text-white">
      <SiteHeader night />

      <main className="flex-1 pb-24 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-white/60 hover:text-white">
            <ChevronLeft className="size-4" /> Semua kos
          </Link>
          <h1 className="mt-3 text-3xl tracking-tight sm:text-[2.4rem]">
            <span className="font-bold">{kos.name}</span>
          </h1>
          {kos.tagline && <p className="mt-1 text-lg text-white/60">{kos.tagline}</p>}
          <p className="mb-6 mt-2 flex items-center gap-1 text-sm text-white/60">
            <MapPin className="size-4" /> {kos.address}
          </p>

          <GalleryGrid photos={photos} name={kos.name} />

          <div className="grid gap-x-20 lg:grid-cols-[1fr_370px]">
            <div className="min-w-0">
              {/* Ringkasan */}
              <div className="border-b border-white/10 py-8">
                <h2 className="text-2xl font-bold">
                  {genderLabel[kos.gender]} di {district}
                </h2>
                <p className="mt-1 text-white/60">
                  {total} kamar · {kos.roomTypes.length} tipe kamar · {available > 0 ? `${available} kamar kosong` : "Saat ini penuh"}
                </p>
              </div>

              {/* Pengelola */}
              {kos.managerName && (
                <div className="flex items-center gap-4 border-b border-white/10 py-6">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-lime text-lg font-bold text-night">
                    {kos.managerName[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Dikelola oleh {kos.managerName}</p>
                    <p className="text-sm text-white/60">Pengelola {kos.name} · Tim SmartKos</p>
                  </div>
                  {kos.whatsapp && (
                    <a
                      href={waLink(kos.whatsapp, `Halo, saya mau tanya tentang ${kos.name}.`)}
                      target="_blank"
                      rel="noopener"
                      aria-label="Chat pengelola"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 lg:hidden"
                    >
                      <MessageCircle className="size-5" />
                    </a>
                  )}
                </div>
              )}

              {/* Sorotan */}
              <ul className="space-y-6 border-b border-white/10 py-8">
                {nearest && (
                  <li className="flex gap-5">
                    <MapPin className="size-6 shrink-0 text-lime" strokeWidth={1.5} />
                    <div>
                      <p className="font-semibold">Dekat {nearest.name}</p>
                      <p className="text-sm text-white/60">Sekitar {nearest.distance} dari kos.</p>
                    </div>
                  </li>
                )}
                {kos.defaultDeposit > 0 && (
                  <li className="flex gap-5">
                    <ShieldCheck className="size-6 shrink-0 text-lime" strokeWidth={1.5} />
                    <div>
                      <p className="font-semibold">Deposit {price(kos.defaultDeposit)}, bisa kembali utuh</p>
                      <p className="text-sm text-white/60">Dikembalikan saat selesai sewa jika tidak ada kerusakan atau tunggakan.</p>
                    </div>
                  </li>
                )}
                <li className="flex gap-5">
                  <CreditCard className="size-6 shrink-0 text-lime" strokeWidth={1.5} />
                  <div>
                    <p className="font-semibold">Bayar bulanan, tanpa ribet</p>
                    <p className="text-sm text-white/60">Tagihan muncul di akun penghuni, cukup transfer dan upload bukti.</p>
                  </div>
                </li>
              </ul>

              {kos.description && (
                <div className="space-y-4 border-b border-white/10 py-8 leading-relaxed text-white/80">
                  {kos.description.split("\n").filter(Boolean).map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              )}

              {/* Tipe kamar */}
              <section id="kamar" className="scroll-mt-24 border-b border-white/10 py-8">
                <h2 className="text-2xl font-bold">Pilih tipe kamar</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {kos.roomTypes.map((type) => (
                    <div key={type.id} className="rounded-3xl bg-night-2 p-3 pb-4 ring-1 ring-white/6 sm:p-4">
                      <div className="relative">
                        <PhotoCarousel photos={type.photos.map((p) => p.url)} alt={`Kamar ${type.name}`} className="aspect-4/3 rounded-2xl" />
                        <span className={`absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-[11px] font-bold ${tierOf(type.monthlyPrice).tag}`}>
                          SmartKos {tierOf(type.monthlyPrice).label}
                        </span>
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">Kamar {type.name}</h3>
                          <p className="text-sm text-white/60">{type.size}</p>
                        </div>
                        <p className="text-right">
                          <span className="font-bold">{price(type.monthlyPrice)}</span>
                          <span className="block text-xs text-white/60">per bulan</span>
                        </p>
                      </div>
                      {type.description && <p className="mt-2 text-sm leading-relaxed text-white/60">{type.description}</p>}
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {type.facilities?.map((f) => (
                          <li key={f} className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/75">
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-sm font-semibold ${type.availableRooms === 0 ? "text-white/45" : type.availableRooms <= 2 ? "text-lime" : "text-white/80"}`}>
                          {type.availableRooms === 0 ? "Penuh" : `Sisa ${type.availableRooms} dari ${type.totalRooms} kamar`}
                        </span>
                        <Link href={`?tipe=${type.id}#booking`} scroll={false} className="rounded-full border border-lime px-4 py-1.5 text-sm font-semibold text-lime transition hover:bg-lime hover:text-night">
                          Pilih kamar ini
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Fasilitas */}
              {kos.facilities && kos.facilities.length > 0 && (
                <section className="border-b border-white/10 py-8">
                  <h2 className="text-2xl font-bold">Fasilitas bersama</h2>
                  <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {kos.facilities.map((f) => {
                      const Icon = facilityIcon(f);
                      return (
                        <li key={f} className="flex items-center gap-4">
                          <Icon className="size-6 shrink-0 text-lime" strokeWidth={1.5} /> {f}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {/* Lokasi */}
              <section id="lokasi" className="scroll-mt-24 border-b border-white/10 py-8">
                <h2 className="text-2xl font-bold">Lokasi</h2>
                <p className="mt-1 text-white/60">{kos.address}</p>
                {hasCoords && (
                  <iframe
                    title={`Peta ${kos.name}`}
                    className="mt-6 h-80 w-full rounded-xl border border-white/10"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${kos.longitude! - 0.008},${kos.latitude! - 0.005},${kos.longitude! + 0.008},${kos.latitude! + 0.005}&layer=mapnik&marker=${kos.latitude},${kos.longitude}`}
                  />
                )}
                {kos.nearby && kos.nearby.length > 0 && (
                  <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {kos.nearby.map((place) => {
                      const Icon = placeIcon(place.name);
                      return (
                        <li key={place.name} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-3">
                            <Icon className="size-5 shrink-0 text-white/60" strokeWidth={1.5} /> {place.name}
                          </span>
                          <span className="shrink-0 text-white/60">{place.distance}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <a href={mapsUrl} target="_blank" rel="noopener" className="mt-5 inline-block text-sm font-semibold text-lime underline underline-offset-4">
                  Buka di Google Maps
                </a>
              </section>

              {/* Peraturan */}
              {rules.length > 0 && (
                <section className="py-8">
                  <h2 className="text-2xl font-bold">Hal yang perlu diketahui</h2>
                  <ul className="mt-5 space-y-3">
                    {rules.map((r) => (
                      <li key={r} className="flex gap-3">
                        <span className="mt-2.5 size-1 shrink-0 rounded-full bg-lime" /> {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Kartu pemesanan */}
            <aside className="hidden pb-10 pt-8 lg:block">
              <div className="sticky top-28 space-y-4">
                <Suspense fallback={<div className="h-96 rounded-xl border border-white/10" />}>
                  <BookingCard roomTypes={kos.roomTypes} deposit={kos.defaultDeposit} whatsapp={kos.whatsapp} kosName={kos.name} slug={kos.slug} />
                </Suspense>
                {kos.whatsapp && (
                  <a
                    href={waLink(kos.whatsapp, `Halo, saya mau tanya tentang ${kos.name}.`)}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-center gap-2 rounded-full border border-white/10 py-3 text-sm font-semibold hover:border-lime"
                  >
                    <MessageCircle className="size-4" /> Tanya pengelola dulu
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>

        {others.length > 0 && (
          <section className="border-t border-white/10">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
              <h2 className="text-2xl font-bold">Cabang SmartKos lainnya</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((k) => (
                  <KosCard key={k.id} kos={k} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Suspense>
        <MobileBookingBar
          roomTypes={kos.roomTypes}
          deposit={kos.defaultDeposit}
          whatsapp={kos.whatsapp}
          kosName={kos.name}
          slug={kos.slug}
          minPrice={minPrice}
        />
      </Suspense>

      <SiteFooter />
      <WhatsAppFab phone={kos.whatsapp ?? undefined} message={"Halo, saya mau tanya tentang " + kos.name + "."} raised />
    </div>
  );
}
