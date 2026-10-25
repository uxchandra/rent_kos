/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
// PRATINJAU tema lavender pastel (seluruh halaman lembut, teks ungu tua). Landing asli tetap di app/page.tsx.
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Cctv,
  ChevronRight,
  CookingPot,
  MapPin,
  MessageCircle,
  Sofa,
  SquareParking,
  UserRound,
  WashingMachine,
  Wifi,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { Faq } from "@/components/faq";
import { Phone, TenantScreen } from "@/components/landing/phone";
import { Ornament } from "@/components/landing/ornament";
import { HouseBadge, HouseFrame } from "@/components/landing/house-frame";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { getKosList, getRoomListings } from "@/lib/public-api";
import { genderLabel, price, waLink } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pratinjau tema lavender pastel",
  robots: { index: false, follow: false },
};

/** Warna pastel pendamping lavender, dipakai bergantian untuk kotak ikon fasilitas. */
const pastels = ["bg-[#e6dcff] text-brand-700", "bg-[#ffe1ee] text-[#b4366f]", "bg-mint text-mint-ink", "bg-[#ffe9d6] text-[#b3611b]"];

const facilities = [
  { icon: Wifi, title: "WiFi 24 Jam" },
  { icon: BedDouble, title: "Kamar berperabot" },
  { icon: Cctv, title: "CCTV 24 jam" },
  { icon: SquareParking, title: "Area parkir" },
  { icon: Sofa, title: "Ruang Tamu" },
  { icon: CookingPot, title: "Dapur bersama" },
  { icon: WashingMachine, title: "Laundry" },
  { icon: UserRound, title: "Penjaga Kost" },
];

const journey = [
  { title: "Pilih kamar", text: "Atur jadwal survey lewat WhatsApp." },
  { title: "Ajukan sewa", text: "Isi data diri dan tanggal masuk. Pengelola akan menghubungi kamu untuk konfirmasi." },
  { title: "Bayar dan pindahan", text: "Bayar sewa bulan pertama dan deposit, lalu ambil kunci di hari masuk." },
];

/** Kata kunci: huruf miring serif warna ungu, terasa lembut tanpa stabilo. */
const Soft = ({ children }: { children: React.ReactNode }) => (
  <span className="font-serif text-[1.12em] font-normal italic text-brand-600">{children}</span>
);

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

function AvailabilityBadge({ count }: { count: number }) {
  if (count === 0) return <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-900/45">Penuh</span>;
  if (count <= 2) return <span className="shrink-0 rounded-full bg-[#ffe1ee] px-3 py-1 text-xs font-bold text-[#b4366f]">Sisa {count}</span>;
  return <span className="shrink-0 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-mint-ink">{count} kosong</span>;
}

export default async function PreviewLavenderPage() {
  const [rooms, kosList] = await Promise.all([getRoomListings(), getKosList()]);
  const cities = [...new Set(kosList.map((k) => k.city))];
  const featured = [...rooms].sort((a, b) => b.availableRooms - a.availableRooms);
  const showcase = featured.find((r) => r.photos.length) ?? featured[0];
  const cityText = cities.length > 1 ? `${cities.slice(0, -1).join(", ")}, dan ${cities.at(-1)}` : cities[0] ?? "kotamu";
  const heroPhoto = kosList.find((k) => k.coverImage)?.coverImage ?? "/uploads/seed/about-room.jpg";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f5f1ff] text-brand-950">
      <p className="bg-brand-200 px-4 py-1.5 text-center text-xs font-semibold text-brand-900">
        Pratinjau tema lavender pastel ·{" "}
        <Link href="/preview-terang" className="underline underline-offset-2">
          lihat versi putih
        </Link>{" "}
        ·{" "}
        <Link href="/" className="underline underline-offset-2">
          versi sekarang
        </Link>
      </p>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-linear-to-b from-[#ebe3ff] to-[#f5f1ff]">
          <Ornament tone="light" className="absolute -left-6 bottom-4 hidden w-60 sm:block lg:-left-28 lg:bottom-0" />
          <div className="absolute -right-40 -top-24 size-[520px] rounded-full bg-[#ffd9ea]/70 blur-3xl motion-safe:animate-drift" />
          <div className="absolute -left-32 top-40 size-[380px] rounded-full bg-brand-200/70 blur-3xl motion-safe:animate-drift motion-safe:[animation-delay:-8s]" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:pb-20 lg:pt-10">
            <div className="text-center lg:text-left">
              <h1 data-reveal className="mt-4 text-balance text-[2.1rem] font-bold leading-[1.2] tracking-tight sm:text-5xl lg:mt-0 lg:text-[3.1rem] lg:leading-[1.15]">
                Kos bersih dan nyaman di <Soft>{cityText}</Soft>
              </h1>
              <div data-reveal style={delay(220)} className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  href="/kamar"
                  className="group flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800"
                >
                  Cari kamar <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                <a href="#cabang" className="rounded-full bg-white/80 px-5 py-3 font-semibold text-brand-800 ring-1 ring-brand-200 transition hover:bg-white">
                  Lihat cabang
                </a>
              </div>
              <ul data-reveal style={delay(320)} className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-2 sm:gap-3 lg:mx-0">
                {kosList.slice(0, 3).map((k) => (
                  <li key={k.slug}>
                    <Link href={`/${k.slug}`} className="block rounded-2xl bg-white/70 p-3 ring-1 ring-brand-100 backdrop-blur transition hover:bg-white hover:ring-brand-300">
                      <span className="block text-xs text-brand-900/55">{k.city}</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">{k.name.replace("SmartKos ", "")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative order-first mx-auto h-[330px] w-full max-w-[330px] sm:h-[520px] sm:max-w-[440px] lg:order-none lg:h-[470px] lg:max-w-[410px]">
              <HouseFrame src={heroPhoto} alt="Cabang SmartKos" className="absolute left-0 top-0 h-[78%] w-[72%] shadow-xl shadow-brand-900/15 motion-safe:animate-float-slow" />
              {showcase && (
                <Phone className="absolute bottom-0 right-0 origin-bottom-right motion-safe:animate-float motion-safe:[animation-delay:-3s] scale-[0.64] sm:scale-[0.8] lg:scale-[0.74]">
                  <TenantScreen room={showcase} />
                </Phone>
              )}
              <span className="absolute bottom-[14%] left-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-800 shadow-lg shadow-brand-900/10 motion-safe:animate-pop motion-safe:[animation-delay:700ms] sm:bottom-[18%] sm:left-[6%] sm:px-4 sm:py-2 sm:text-sm">
                Bayar sewa bisa dari HP
              </span>
            </div>
          </div>
        </section>

        {/* Fasilitas */}
        <section id="fasilitas" className="relative scroll-mt-20 overflow-hidden">
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 data-reveal className="text-balance text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-left">
              <Soft>Fasilitas</Soft>
            </h2>
            <ul className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-10 lg:grid-cols-4">
              {facilities.map(({ icon: Icon, title }, i) => (
                <li
                  key={title}
                  data-reveal
                  style={delay(i * 60)}
                  className="flex flex-col items-center gap-3 rounded-3xl bg-white/75 px-3 py-6 text-center ring-1 ring-brand-100 sm:flex-row sm:px-5 sm:py-5 sm:text-left"
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${pastels[i % pastels.length]}`}>
                    <Icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-semibold sm:text-base">{title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Perjalanan sewa: panel putih membulat di atas latar lavender */}
        <section id="cara-sewa" className="scroll-mt-20 px-3 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white px-4 py-16 shadow-sm shadow-brand-900/5 sm:rounded-[2.5rem] sm:px-10">
            <Ornament tone="light" className="absolute -right-8 -top-6 w-52 rotate-12" />
            <h2 data-reveal className="relative text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Cara sewa kamar <Soft>di SmartKos</Soft>
            </h2>
            <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
              <span className="absolute left-[16%] right-[16%] top-6 hidden border-t-2 border-dashed border-brand-200 md:block" aria-hidden />
              {journey.map((s, i) => (
                <li key={s.title} data-reveal style={delay(i * 140)} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                  <HouseBadge>{i + 1}</HouseBadge>
                  <div>
                    <h3 className="text-lg font-semibold md:mt-4">{s.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-brand-900/60 md:mx-auto md:max-w-[16rem]">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-12 text-center">
              <Link
                href="/kamar"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-800"
              >
                Cari kamar <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Cabang */}
        <section id="cabang" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div data-reveal className="flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Cabang <Soft>SmartKos</Soft>
              </h2>
              <p className="max-w-sm text-brand-900/60">Pilih cabang untuk melihat tipe kamar, fasilitas, dan lokasinya.</p>
            </div>
            <div
              data-reveal
              style={delay(100)}
              className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:mt-10 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-3"
            >
              {kosList.map((k) => (
                <Link
                  key={k.slug}
                  href={`/${k.slug}`}
                  className="group block w-[78%] shrink-0 snap-center rounded-[2rem] bg-white p-2.5 ring-1 ring-brand-100 transition hover:ring-brand-300 md:w-auto"
                >
                  <div className="relative overflow-hidden rounded-[1.6rem]">
                    <img src={k.coverImage ?? ""} alt={k.name} className="aspect-4/3 w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-900">{genderLabel[k.gender]}</span>
                  </div>
                  <div className="px-3 pb-2 pt-4">
                    <p className="flex items-center gap-1 text-sm text-brand-600">
                      <MapPin className="size-3.5" /> {k.city}
                    </p>
                    <h3 className="mt-1 text-xl font-bold">{k.name}</h3>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-brand-900/60">
                        Mulai <b className="text-brand-950">{k.minPrice ? price(k.minPrice) : "-"}</b>/bln
                      </p>
                      <span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700 transition group-hover:translate-x-1 group-hover:bg-brand-700 group-hover:text-white">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pilihan kamar */}
        {rooms.length > 0 && (
          <section id="pilihan-kamar" className="scroll-mt-20 bg-[#ece5ff]">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
              <div data-reveal className="flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
                <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Pilihan <Soft>kamar</Soft>
                </h2>
                <p className="max-w-sm text-brand-900/60">Harga per bulan, sudah termasuk WiFi dan air.</p>
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-3 lg:mt-10 lg:grid-cols-2">
                {featured.slice(0, 6).map((r, i) => (
                  <li key={r.id} data-reveal style={delay(i * 70)}>
                    <Link
                      href={`/${r.kos.slug}?tipe=${r.id}`}
                      className="flex items-center gap-4 rounded-3xl bg-white p-3 pr-4 transition hover:shadow-md hover:shadow-brand-900/10"
                    >
                      <img src={r.photos[0]?.url ?? r.kos.coverImage ?? ""} alt="" className="size-16 shrink-0 rounded-2xl object-cover sm:size-20" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{r.kos.name}</p>
                        <p className="truncate text-sm text-brand-900/55">Tipe {r.name}</p>
                        <p className="mt-0.5 text-sm font-semibold text-brand-700">
                          {price(r.monthlyPrice)}
                          <span className="font-normal text-brand-900/55">/bln</span>
                        </p>
                      </div>
                      <AvailabilityBadge count={r.availableRooms} />
                      <ChevronRight className="hidden size-5 shrink-0 text-brand-300 sm:block" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div data-reveal className="mt-10 text-center">
                <Link
                  href="/kamar"
                  className="group inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 font-semibold text-white transition hover:bg-brand-800"
                >
                  {rooms.length > 6 ? `Lihat semua ${rooms.length} tipe kamar` : "Cari & bandingkan kamar"}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-10 lg:py-24">
            <div data-reveal className="text-center lg:text-left">
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Pertanyaan yang <Soft>sering ditanyakan</Soft>
              </h2>
              <p className="mt-4 text-brand-900/60">Belum menemukan jawabannya? Tanya langsung ke admin kami.</p>
              <a
                href={waLink(site.whatsapp, "Halo SmartKos, saya mau bertanya.")}
                target="_blank"
                rel="noopener"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-200 hover:ring-brand-400"
              >
                <MessageCircle className="size-4" /> Chat WhatsApp
              </a>
            </div>
            <div data-reveal style={delay(120)} className="rounded-3xl bg-white p-2 sm:p-4">
              <Faq />
            </div>
          </div>
        </section>

        {/* CTA: pita lilac pastel */}
        <section className="px-3 pb-16 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-linear-to-br from-brand-200 via-[#e4d8ff] to-[#ffdcec] sm:rounded-[2.5rem]">
            <Ornament tone="light" className="absolute bottom-0 left-1/2 w-56 -translate-x-1/2" />
            <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-14 sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:py-16">
              <div data-reveal className="text-center lg:text-left">
                <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Mau lihat kamarnya <Soft>langsung?</Soft>
                </h2>
                <p className="mx-auto mt-4 max-w-md text-brand-900/70 lg:mx-0">
                  Atur jadwal survey dengan pengelola cabang. Gratis, dan kamu tidak wajib langsung sewa.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                  <a
                    href={waLink(site.whatsapp, "Halo SmartKos, saya mau jadwalkan survey kamar.")}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-800"
                  >
                    <MessageCircle className="size-4" /> Jadwalkan survey
                  </a>
                  <Link href="/kamar" className="flex items-center gap-2 rounded-full bg-white/70 px-6 py-3 font-semibold text-brand-800 transition hover:bg-white">
                    Cari kamar
                  </Link>
                </div>
              </div>
              <div data-reveal style={delay(150)}>
                <HouseFrame src="/uploads/seed/jogja-prem-2.jpg" alt="Kamar SmartKos" className="mx-auto aspect-square w-full max-w-65 motion-safe:animate-float-slow sm:max-w-sm" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <RevealObserver />

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
