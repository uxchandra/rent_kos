/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Gift,
  Handshake,
  KeyRound,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sofa,
  Sparkles,
  Wifi,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { Heading } from "@/components/heading";
import { Carousel } from "@/components/carousel";
import { HeroSearch } from "@/components/hero-search";
import { RoomCard } from "@/components/room-card";
import { PersonaTabs } from "@/components/persona-tabs";
import { Faq } from "@/components/faq";
import { getKosList, getRoomListings } from "@/lib/public-api";
import { genderShort, price } from "@/lib/format";
import { tierOf, tiers } from "@/lib/tiers";

const benefits = [
  { icon: Sofa, label: "Kamar sudah berperabot" },
  { icon: Sparkles, label: "Area bersama dibersihkan rutin" },
  { icon: CalendarDays, label: "Sewa bulanan, tanpa kontrak tahunan" },
  { icon: Wifi, label: "WiFi kencang di semua cabang" },
  { icon: Wrench, label: "Perbaikan cepat oleh pengelola" },
  { icon: ShieldCheck, label: "CCTV & akses terkontrol" },
];

const categories = [
  { label: "Kamar mandi luar", href: "/kamar?tier=hemat", photo: "/uploads/seed/jogja-std-1.jpg" },
  { label: "Kamar mandi dalam", href: "/kamar?tier=nyaman", photo: "/uploads/seed/jogja-prem-3.jpg" },
  { label: "Kos putri", href: "/kamar?khusus=putri", photo: "/uploads/seed/jogja-prem-2.jpg" },
  { label: "Suite + pantry", href: "/kamar?tier=eksklusif", photo: "/uploads/seed/jakarta-suite-2.jpg" },
];

const perks = [
  { icon: PartyPopper, title: "Acara penghuni", text: "Makan bareng, nonton bareng, sampai kerja bakti kecil-kecilan tiap bulan." },
  { icon: Handshake, title: "Kenalan baru", text: "Ruang bersama yang bikin gampang kenal sesama penghuni." },
  { icon: Gift, title: "Promo partner", text: "Diskon laundry, katering, dan gym di sekitar cabang." },
  { icon: KeyRound, title: "Pindah cabang", text: "Pindah kota? Pindah ke cabang lain tanpa urus ulang dari nol." },
];

export default async function HomePage() {
  const [rooms, kosList] = await Promise.all([getRoomListings(), getKosList()]);
  const cities = [...new Set(kosList.map((k) => k.city))];
  const minPrice = rooms.length ? Math.min(...rooms.map((r) => r.monthlyPrice)) : null;
  const totalRooms = kosList.reduce((s, k) => s + k.totalRooms, 0);
  const available = kosList.reduce((s, k) => s + k.availableRooms, 0);
  const featured = [...rooms].sort((a, b) => b.availableRooms - a.availableRooms);
  const tierAvg = tiers.map((t) => {
    const prices = rooms.filter((r) => tierOf(r.monthlyPrice).id === t.id).map((r) => r.monthlyPrice);
    return { ...t, avg: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length / 100_000) / 10 : null };
  });

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <img src="/uploads/seed/hero-living.jpg" alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-32 pt-14 text-center text-white sm:px-6 sm:pb-36 sm:pt-24">
            <h1 className="font-serif text-5xl leading-[1.05] sm:text-7xl">
              <em>Rumah keduamu,</em>
              <br />
              di kota yang baru
            </h1>
            {minPrice && (
              <p className="mt-7 rounded-full border border-white/70 px-5 py-2 text-sm">
                Mulai dari <span className="text-lg font-bold">{price(minPrice)}</span>/bulan
              </p>
            )}
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
              <li className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-accent" /> Sewa bulanan
              </li>
              <li className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-accent" /> Kamar siap huni
              </li>
              <li className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-accent" /> {cities.length} kota
              </li>
            </ul>
            <Link
              href="/kamar"
              className="mt-8 flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 font-semibold transition hover:bg-brand-700"
            >
              Lihat kamar <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
        <div className="relative z-10 mx-auto -mt-20 max-w-4xl px-4">
          <HeroSearch cities={cities} />
        </div>

        {/* Kenapa SmartKos */}
        <section id="kenapa" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr_1.1fr]">
            <Heading light="Tinggal nyaman bareng" bold={`SmartKos di ${cities.length} kota`} />
            <ul className="space-y-4">
              {benefits.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-4 text-sm">
                  <Icon className="size-6 shrink-0 text-brand-600" strokeWidth={1.5} /> {label}
                </li>
              ))}
            </ul>
            <img src="/uploads/seed/about-room.jpg" alt="Kamar SmartKos" className="aspect-4/3 w-full rounded-2xl object-cover" />
          </div>
          <dl className="mt-14 grid grid-cols-3 divide-x divide-line border-y border-line py-6 text-center">
            {[
              [kosList.length, "Cabang"],
              [totalRooms, "Kamar dikelola"],
              [available, "Kamar kosong saat ini"],
            ].map(([value, label]) => (
              <div key={label}>
                <dd className="text-3xl font-bold text-brand-600">{value}</dd>
                <dt className="mt-1 text-sm text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Cabang */}
        <section id="cabang" className="scroll-mt-28 bg-cream">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
            <Carousel className="order-2 min-w-0 lg:order-1">
              {kosList.map((k) => (
                <Link key={k.slug} href={`/${k.slug}`} className="group w-[78%] shrink-0 snap-start sm:w-[46%]">
                  <div className="overflow-hidden rounded-2xl">
                    <img src={k.coverImage ?? ""} alt={k.name} className="aspect-4/3 w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <p className="mt-3 font-semibold">{k.name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-3.5" /> {k.city} · Kos {genderShort[k.gender].toLowerCase()}
                  </p>
                </Link>
              ))}
            </Carousel>
            <div className="order-1 lg:order-2 lg:pt-6">
              <Heading light="Cintai tempat" bold="tinggalmu" />
              <p className="mt-5 max-w-sm text-muted">
                Setiap cabang punya karakter sendiri, dari gang tenang dekat kampus sampai gedung dekat MRT. Standar
                kebersihan dan pelayanannya tetap sama.
              </p>
            </div>
          </div>
        </section>

        {/* Kamar pilihan */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2.4fr]">
          <div>
            <Heading light="Kamar yang" bold="masih tersedia" />
            <p className="mt-5 text-muted">Pilih tipe kamar dari semua cabang. Sisa kamar diperbarui langsung oleh pengelola.</p>
            <Link href="/kamar" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
              Lihat semua kamar <ArrowRight className="size-4" />
            </Link>
          </div>
          <Carousel className="min-w-0">
            {featured.map((r) => (
              <RoomCard key={r.id} room={r} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]" />
            ))}
          </Carousel>
        </section>

        {/* Kategori */}
        <section className="bg-cream">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[2fr_1fr]">
            <div className="order-2 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:order-1">
              {categories.map((c) => (
                <Link key={c.label} href={c.href} className="group overflow-hidden rounded-2xl bg-white">
                  <img src={c.photo} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                  <p className="px-3 py-3 text-center text-sm font-semibold">{c.label}</p>
                </Link>
              ))}
            </div>
            <Heading className="order-1 lg:order-2" light="Yang pas untuk" bold="gaya hidupmu" />
          </div>
        </section>

        {/* Tier budget */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2.4fr]">
          <Heading light="Ada pilihan untuk" bold="setiap budget" />
          <div className="grid gap-5 sm:grid-cols-3">
            {tierAvg.map((t) => (
              <div key={t.id} className={`flex flex-col rounded-2xl p-6 ${t.card}`}>
                <span className={`self-start rounded-md px-2 py-0.5 text-xs font-bold ${t.tag}`}>SmartKos {t.label}</span>
                <p className="mt-6 text-xs text-muted">Rata-rata</p>
                <p className="text-sm">
                  IDR <span className="text-4xl font-bold">{t.avg ? `${t.avg.toLocaleString("id-ID")}jt` : "-"}</span> / bulan
                </p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink/80">{t.text}</p>
                <Link href={`/kamar?tier=${t.id}`} className={`mt-6 rounded-full py-2.5 text-center text-sm font-semibold transition ${t.button}`}>
                  Lihat SmartKos {t.label}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Persona */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Heading className="mb-10 max-w-md" light="Tempat yang cocok untuk" bold="mahasiswa & pekerja" />
            <PersonaTabs />
          </div>
        </section>

        {/* Perks */}
        <section className="bg-cream">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2.2fr]">
            <Heading light="Lebih dari" bold="sekadar kamar" />
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {perks.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon className="size-9 text-brand-600" strokeWidth={1.25} />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-28 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <Heading light="Ada yang" bold="mau ditanyakan?" />
          <Faq />
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
