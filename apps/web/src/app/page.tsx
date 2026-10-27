/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
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
import { Glow } from "@/components/landing/glow";
import { HOUSE_CLIP, HouseBadge, HouseFrame } from "@/components/landing/house-frame";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { getKosList, getRoomListings } from "@/lib/public-api";
import { price, waLink } from "@/lib/format";
import { site } from "@/lib/site";

// Fasilitas umum yang tercatat di data cabang (lihat menu Cabang di admin).
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

const Lime = ({ children }: { children: React.ReactNode }) => <span className="text-lime">{children}</span>;

/** Jeda muncul untuk elemen [data-reveal] (lihat globals.css & RevealObserver). */
const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

/** Sisa 1–2 kamar disorot lime, sisanya netral, penuh diredupkan. */
function AvailabilityBadge({ count }: { count: number }) {
  if (count === 0) return <span className="shrink-0 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/50">Penuh</span>;
  if (count <= 2) return <span className="shrink-0 rounded-full bg-lime px-3 py-1 text-xs font-bold text-night">Sisa {count}</span>;
  return <span className="shrink-0 rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-lime">{count} kosong</span>;
}

export default async function HomePage() {
  const [rooms, kosList] = await Promise.all([getRoomListings(), getKosList()]);
  const featured = [...rooms].sort((a, b) => b.availableRooms - a.availableRooms);
  const showcase = featured.find((r) => r.photos.length) ?? featured[0];
  const openKos = kosList.filter((k) => !k.comingSoon);
  const comingSoon = kosList.filter((k) => k.comingSoon);
  const heroPhoto = openKos.find((k) => k.coverImage)?.coverImage ?? "/uploads/seed/about-room.jpg";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-night">
      <SiteHeader night />

      <main className="flex-1 text-white">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <Glow opacity={0.35} className="-right-56 -top-40 size-[680px] motion-safe:animate-drift" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:pb-20 lg:pt-10">
            <div className="text-center lg:text-left">
              <h1 data-reveal className="mt-4 text-balance text-[2.1rem] font-bold leading-[1.15] tracking-tight sm:text-5xl lg:mt-0 lg:text-[3.1rem] lg:leading-[1.12]">
                Temukan kos nyaman, <Lime>mulai dari sini</Lime>
              </h1>
              <p data-reveal style={delay(120)} className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
                Pindah kos tanpa drama. Survey, sewa, sampai bayar bulanan, semuanya beres dari HP.
              </p>
              <div data-reveal style={delay(220)} className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/kamar" className="group flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-semibold text-night transition hover:brightness-95">
                  Cari kamar <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                <a href="#cabang" className="rounded-full border border-lime/60 px-5 py-3 font-semibold text-lime transition hover:bg-lime/10 lg:border-0 lg:text-white/80 lg:underline lg:decoration-lime/60 lg:underline-offset-8 lg:hover:bg-transparent lg:hover:text-white">
                  Lihat cabang
                </a>
              </div>
              <ul data-reveal style={delay(320)} className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-2 sm:gap-3 lg:mx-0">
                {openKos.slice(0, 3).map((k) => (
                  <li key={k.slug}>
                    <Link href={`/${k.slug}`} className="block rounded-2xl border border-white/10 bg-white/4 p-3 transition hover:border-lime/50">
                      <span className="block text-xs text-white/55">{k.city}</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">{k.name.replace("SmartKos ", "")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative order-first mx-auto h-[330px] w-full max-w-[330px] sm:h-[520px] sm:max-w-[440px] lg:order-none lg:h-[470px] lg:max-w-[410px]">
              <Glow tone="lime" opacity={0.14} className="-inset-[15%] motion-safe:animate-drift motion-safe:[animation-delay:-6s]" />
              <HouseFrame src={heroPhoto} alt="Cabang SmartKos" className="absolute left-0 top-0 h-[78%] w-[72%] motion-safe:animate-float-slow" />
              {showcase && (
                <Phone className="absolute bottom-0 right-0 origin-bottom-right motion-safe:animate-float motion-safe:[animation-delay:-3s] scale-[0.64] sm:scale-[0.8] lg:scale-[0.74]">
                  <TenantScreen room={showcase} />
                </Phone>
              )}
              <span className="absolute bottom-[14%] left-0 rounded-full bg-lime px-3.5 py-1.5 text-xs font-semibold text-night shadow-lg motion-safe:animate-pop motion-safe:[animation-delay:700ms] sm:bottom-[18%] sm:left-[6%] sm:px-4 sm:py-2 sm:text-sm">
                Bayar sewa bisa dari HP
              </span>
            </div>
          </div>
        </section>

        {/* Cabang: kartu berbentuk rumah langsung di latar halaman */}
        <section id="cabang" className="relative scroll-mt-20 overflow-hidden">
          <Ornament className="absolute -right-8 top-4 hidden w-52 rotate-12 sm:block" />
          <Glow opacity={0.25} className="-left-48 top-1/4 size-[520px] motion-safe:animate-drift" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div data-reveal className="flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Cabang <Lime>SmartKos</Lime>
              </h2>
              <p className="max-w-sm text-white/60">Pilih cabang untuk melihat tipe kamar, fasilitas, dan lokasinya.</p>
            </div>

            {/* HP: geser ke samping; md ke atas: grid */}
            <div data-reveal style={delay(100)} className={`no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 pt-1 md:mx-0 md:mt-10 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 ${openKos.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {openKos.map((k) => (
                <Link
                  key={k.slug}
                  href={`/${k.slug}`}
                  className="group flex w-[80%] shrink-0 snap-center flex-col rounded-[1.75rem] bg-night-2 p-3 ring-1 ring-white/8 transition duration-300 hover:-translate-y-1 hover:ring-lime/40 md:w-auto"
                >
                  <div className="relative aspect-5/4 overflow-hidden rounded-b-[1.4rem]" style={{ clipPath: HOUSE_CLIP }}>
                    {/* Foto landmark daerah; cabang tanpa foto daerah memakai foto cover */}
                    <img src={k.areaImage ?? k.coverImage ?? ""} alt={k.area ?? k.city} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-linear-to-t from-night-2/80 via-transparent to-transparent" />
                  </div>
                  {k.areaImage && k.areaImageCredit && <p className="mt-1.5 px-2 text-[10px] leading-snug text-white/35">{k.areaImageCredit}</p>}
                  <div className="flex flex-1 flex-col px-2 pb-1 pt-3">
                    <h3 className="text-2xl font-bold tracking-tight">{k.area ?? k.city}</h3>
                    <p className="mt-2 flex gap-1.5 text-sm leading-relaxed text-white/60">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-lime" /> {k.address}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="w-full border-t border-dashed border-white/12 pt-4 text-sm font-semibold text-white/80 transition group-hover:text-lime">Lihat cabang</span>
                      <span className="mt-4 grid size-11 shrink-0 place-items-center rounded-full bg-white/8 transition group-hover:bg-lime group-hover:text-night">
                        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Cabang yang sedang disiapkan: kartu ringkas */}
            {comingSoon.length > 0 && (
              <div data-reveal style={delay(160)} className="mt-12">
                <h3 className="text-center text-lg font-semibold md:text-left">
                  Segera <Lime>hadir</Lime>
                </h3>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {comingSoon.map((k) => (
                    <li key={k.slug}>
                      <Link
                        href={`/${k.slug}`}
                        className="group flex items-center gap-4 rounded-2xl border border-dashed border-white/15 p-3 pr-4 transition hover:border-lime/50"
                      >
                        {(k.areaImage ?? k.coverImage) ? (
                          <img src={k.areaImage ?? k.coverImage ?? ""} alt="" className="size-16 shrink-0 rounded-xl object-cover opacity-70 grayscale-[40%] transition group-hover:opacity-100" />
                        ) : (
                          <span className="size-16 shrink-0 rounded-xl bg-white/5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{k.area ?? k.name.replace("SmartKos ", "")}</p>
                          <p className="flex items-center gap-1 truncate text-sm text-white/55">
                            <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{k.address}</span>
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-lime" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Pilihan kamar */}
        {rooms.length > 0 && (
          <section id="pilihan-kamar" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-20">
            <div data-reveal className="flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Pilihan <Lime>kamar</Lime>
              </h2>
              <p className="max-w-sm text-white/65">Harga per bulan, sudah termasuk WiFi dan air.</p>
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-3 lg:mt-10 lg:grid-cols-2">
              {featured.slice(0, 6).map((r, i) => (
                <li key={r.id} data-reveal style={delay(i * 70)}>
                  <Link
                    href={`/${r.kos.slug}?tipe=${r.id}`}
                    className="flex items-center gap-4 rounded-2xl bg-night-2 p-3 pr-4 ring-1 ring-white/6 transition hover:ring-lime/40"
                  >
                    <img src={r.photos[0]?.url ?? r.kos.coverImage ?? ""} alt="" className="size-16 shrink-0 rounded-xl object-cover sm:size-20" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.kos.name}</p>
                      <p className="truncate text-sm text-white/55">Tipe {r.name}</p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {price(r.monthlyPrice)}
                        <span className="font-normal text-white/55">/bln</span>
                      </p>
                    </div>
                    <AvailabilityBadge count={r.availableRooms} />
                    <ChevronRight className="hidden size-5 shrink-0 text-white/40 sm:block" />
                  </Link>
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-10 text-center">
              <Link
                href="/kamar"
                className="group inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 font-semibold text-night transition hover:brightness-95"
              >
                {rooms.length > 6 ? `Lihat semua ${rooms.length} tipe kamar` : "Cari & bandingkan kamar"}
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Fasilitas */}
        <section id="fasilitas" className="relative scroll-mt-20 overflow-hidden">
          <Glow tone="lime" opacity={0.1} className="-left-44 top-1/3 size-[440px] motion-safe:animate-drift" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 data-reveal className="text-balance text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-left">
              <Lime>Fasilitas</Lime>
            </h2>
            <ul className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-10 lg:grid-cols-4">
              {facilities.map(({ icon: Icon, title }, i) => (
                <li
                  key={title}
                  data-reveal
                  style={delay(i * 60)}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-night-2 px-3 py-6 text-center ring-1 ring-white/6 sm:flex-row sm:px-5 sm:py-5 sm:text-left"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime ring-1 ring-lime/25">
                    <Icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-semibold sm:text-base">{title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Perjalanan sewa */}
        <section id="cara-sewa" className="relative scroll-mt-20 overflow-hidden border-y border-white/6 bg-night-2/50">
          <Ornament className="absolute -right-8 -top-6 w-52 rotate-12" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 data-reveal className="text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Cara sewa kamar <Lime>di SmartKos</Lime>
            </h2>
            <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
              <span className="absolute left-[16%] right-[16%] top-6 hidden border-t-2 border-dashed border-lime/30 md:block" aria-hidden />
              {journey.map((s, i) => (
                <li key={s.title} data-reveal style={delay(i * 140)} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                  <HouseBadge>{i + 1}</HouseBadge>
                  <div>
                    <h3 className="text-lg font-semibold md:mt-4">{s.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-white/65 md:mx-auto md:max-w-[16rem]">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-12 text-center">
              <Link href="/kamar" className="group inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-semibold text-night transition hover:brightness-95">
                Cari kamar <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative scroll-mt-20 overflow-hidden">
          <Glow opacity={0.3} className="-right-44 top-0 size-[440px] motion-safe:animate-drift motion-safe:[animation-delay:-4s]" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-10 lg:py-24">
            <div data-reveal className="text-center lg:text-left">
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Pertanyaan yang <Lime>sering ditanyakan</Lime>
              </h2>
              <p className="mt-4 text-white/65">Belum menemukan jawabannya? Tanya langsung ke admin kami.</p>
              <a
                href={waLink(site.whatsapp, "Halo SmartKos, saya mau bertanya.")}
                target="_blank"
                rel="noopener"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-lime/60 px-5 py-2.5 text-sm font-semibold text-lime hover:bg-lime/10"
              >
                <MessageCircle className="size-4" /> Chat WhatsApp
              </a>
            </div>
            <div data-reveal style={delay(120)}>
              <Faq night />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-white/6">
          <Ornament className="absolute bottom-0 left-1/2 w-56 -translate-x-1/2 opacity-70" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:py-20">
            <div data-reveal className="text-center lg:text-left">
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Mau lihat kamarnya <Lime>langsung?</Lime>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-white/65 lg:mx-0">
                Atur jadwal survey dengan pengelola cabang. Gratis, dan kamu tidak wajib langsung sewa.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a
                  href={waLink(site.whatsapp, "Halo SmartKos, saya mau jadwalkan survey kamar.")}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-semibold text-night transition hover:brightness-95"
                >
                  <MessageCircle className="size-4" /> Jadwalkan survey
                </a>
                <Link href="/kamar" className="flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-semibold transition hover:border-white">
                  Cari kamar
                </Link>
              </div>
            </div>
            <div data-reveal style={delay(150)}>
              <HouseFrame src="/uploads/seed/jogja-prem-2.jpg" alt="Kamar SmartKos" className="mx-auto aspect-square w-full max-w-65 motion-safe:animate-float-slow sm:max-w-sm" />
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
