/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import Link from "next/link";
import { ArrowRight, ChevronRight, KeyRound, MapPin, MessageCircle, ReceiptText, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { Carousel } from "@/components/carousel";
import { RoomCard } from "@/components/room-card";
import { Faq } from "@/components/faq";
import { Phone, TenantScreen } from "@/components/landing/phone";
import { Ornament } from "@/components/landing/ornament";
import { HouseBadge, HouseFrame } from "@/components/landing/house-frame";
import { getKosList, getRoomListings } from "@/lib/public-api";
import { genderLabel, price, waLink } from "@/lib/format";
import { site } from "@/lib/site";

const promises = [
  {
    icon: Sparkles,
    title: "Kamar sudah berperabot",
    text: "Kasur, lemari, dan meja sudah ada. Kamar juga dibersihkan dulu sebelum kamu masuk.",
    photo: "/uploads/seed/about-room.jpg",
  },
  {
    icon: ReceiptText,
    title: "Harga jelas dari awal",
    text: "Sewa bulanan dan deposit tertulis di setiap tipe kamar, jadi tidak ada biaya tambahan yang tiba-tiba muncul.",
    photo: "/uploads/seed/jogja-kitchen.jpg",
  },
  {
    icon: Smartphone,
    title: "Tagihan bisa dicek online",
    text: "Tagihan bulanan muncul di akun penghuni. Bayar lewat transfer, lalu upload bukti bayarnya.",
    photo: "/uploads/seed/jakarta-lounge.jpg",
  },
  {
    icon: ShieldCheck,
    title: "Pengelola di tiap cabang",
    text: "AC tidak dingin atau keran bocor? Tinggal chat pengelola cabangmu lewat WhatsApp.",
    photo: "/uploads/seed/bandung-living.jpg",
  },
];

const journey = [
  { title: "Pilih kamar", text: "Bandingkan foto, fasilitas, dan harga. Kalau mau lihat langsung, atur jadwal survey lewat WhatsApp." },
  { title: "Ajukan sewa", text: "Isi data diri dan tanggal masuk. Pengelola akan menghubungi kamu untuk konfirmasi." },
  { title: "Bayar dan pindahan", text: "Bayar sewa bulan pertama dan deposit, lalu ambil kunci di hari masuk." },
];

const Lime = ({ children }: { children: React.ReactNode }) => <span className="text-lime">{children}</span>;

export default async function HomePage() {
  const [rooms, kosList] = await Promise.all([getRoomListings(), getKosList()]);
  const cities = [...new Set(kosList.map((k) => k.city))];
  const minPrice = rooms.length ? Math.min(...rooms.map((r) => r.monthlyPrice)) : null;
  const available = kosList.reduce((s, k) => s + k.availableRooms, 0);
  const featured = [...rooms].sort((a, b) => b.availableRooms - a.availableRooms);
  const showcase = featured.find((r) => r.photos.length) ?? featured[0];
  const almostFull = rooms.filter((r) => r.availableRooms > 0 && r.availableRooms <= 2).sort((a, b) => a.availableRooms - b.availableRooms);
  const cityText = cities.length > 1 ? `${cities.slice(0, -1).join(", ")}, dan ${cities.at(-1)}` : cities[0] ?? "kotamu";
  const heroPhoto = kosList.find((k) => k.coverImage)?.coverImage ?? "/uploads/seed/about-room.jpg";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-night">
      <SiteHeader night />

      <main className="flex-1 text-white">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <Ornament className="absolute -left-6 bottom-4 hidden w-60 sm:block" />
          <div className="absolute -right-40 -top-20 size-[560px] rounded-full bg-brand-600/25 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pb-28 lg:pt-20">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-lime">
                <KeyRound className="size-4" /> {available} kamar masih kosong
              </p>
              <h1 className="mt-4 text-balance text-[2.1rem] font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Kos bersih dan nyaman di <Lime>{cityText}</Lime>
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
                Kamar sudah berperabot, harga sudah termasuk WiFi dan air.
                {minPrice && ` Mulai ${price(minPrice)} per bulan, dan bisa survey dulu sebelum sewa.`}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/kamar" className="flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-semibold text-night transition hover:brightness-95">
                  Cari kamar <ArrowRight className="size-4" />
                </Link>
                <a href="#cabang" className="rounded-full border border-lime/60 px-5 py-3 font-semibold text-lime transition hover:bg-lime/10 lg:border-0 lg:text-white/80 lg:underline lg:decoration-lime/60 lg:underline-offset-8 lg:hover:bg-transparent lg:hover:text-white">
                  Lihat cabang
                </a>
              </div>
              <ul className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-2 sm:gap-3 lg:mx-0 lg:mt-10">
                {kosList.slice(0, 3).map((k) => (
                  <li key={k.slug}>
                    <Link href={`/${k.slug}`} className="block rounded-2xl border border-white/10 bg-white/4 p-3 transition hover:border-lime/50">
                      <span className="block text-xs text-white/55">{k.city}</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">{k.name.replace("SmartKos ", "")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative order-first mx-auto h-[330px] w-full max-w-[330px] sm:h-[520px] sm:max-w-[440px] lg:order-none">
              <div className="absolute inset-[10%] rounded-full bg-lime/20 blur-3xl lg:bg-lime/10" aria-hidden />
              <HouseFrame src={heroPhoto} alt="Cabang SmartKos" className="absolute left-0 top-0 h-[78%] w-[72%]" />
              {showcase && (
                <Phone className="absolute bottom-0 right-0 origin-bottom-right scale-[0.64] sm:scale-[0.8]">
                  <TenantScreen room={showcase} />
                </Phone>
              )}
              <span className="absolute bottom-[14%] left-0 rounded-full bg-lime px-3.5 py-1.5 text-xs font-semibold text-night shadow-lg sm:bottom-[18%] sm:left-[6%] sm:px-4 sm:py-2 sm:text-sm">
                Bayar sewa bisa dari HP
              </span>
            </div>
          </div>
        </section>

        {/* Janji SmartKos */}
        <section id="janji" className="relative scroll-mt-20 overflow-hidden">
          <div className="absolute -left-32 top-1/3 size-80 rounded-full bg-lime/10 blur-3xl" aria-hidden />
          <div id="kenapa" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
            <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
              <h2 className="max-w-xl text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Yang kamu dapat <Lime>di setiap cabang</Lime>
              </h2>
              <p className="max-w-sm text-white/65">Fasilitas kamar memang beda-beda per tipe, tapi hal-hal ini selalu ada.</p>
            </div>
            <ul className="mt-9 space-y-6 sm:hidden">
              {promises.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-night-2 text-lime ring-1 ring-white/10">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/65">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-10 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {promises.map(({ icon: Icon, title, text, photo }) => (
                <article key={title} className="flex flex-col overflow-hidden rounded-3xl bg-night-2 ring-1 ring-white/6">
                  <img src={photo} alt="" className="aspect-4/3 w-full object-cover opacity-90" />
                  <div className="relative flex-1 p-5 pt-7">
                    <span className="absolute -top-5 left-5 grid size-10 place-items-center rounded-xl bg-lime text-night shadow-lg">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-semibold leading-snug">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Perjalanan sewa */}
        <section id="cara-sewa" className="relative scroll-mt-20 overflow-hidden border-y border-white/6 bg-night-2/50">
          <Ornament className="absolute -right-8 -top-6 w-52 rotate-12" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Cara sewa kamar <Lime>di SmartKos</Lime>
            </h2>
            <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
              <span className="absolute left-[16%] right-[16%] top-6 hidden border-t-2 border-dashed border-lime/30 md:block" aria-hidden />
              {journey.map((s, i) => (
                <li key={s.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                  <HouseBadge>{i + 1}</HouseBadge>
                  <div>
                    <h3 className="text-lg font-semibold md:mt-4">{s.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-white/65 md:mx-auto md:max-w-[16rem]">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-12 text-center">
              <Link href="/kamar" className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-semibold text-night transition hover:brightness-95">
                Cari kamar <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Tinggal sedikit lagi */}
        {almostFull.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-center lg:gap-10">
              <div className="text-center lg:text-left">
                <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Kamar yang <Lime>hampir penuh</Lime>
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-white/65 lg:mx-0 lg:mt-4">Tipe kamar di bawah ini tinggal tersisa satu atau dua kamar.</p>
              </div>
              <ul className="space-y-3">
                {almostFull.slice(0, 4).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/${r.kos.slug}?tipe=${r.id}`}
                      className="flex items-center gap-4 rounded-2xl bg-night-2 p-3 pr-4 ring-1 ring-white/6 transition hover:ring-lime/40"
                    >
                      <img src={r.photos[0]?.url ?? r.kos.coverImage ?? ""} alt="" className="size-16 shrink-0 rounded-xl object-cover sm:size-20" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{r.kos.name}</p>
                        <p className="truncate text-sm text-white/55">
                          Tipe {r.name} · {price(r.monthlyPrice)}/bln
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-lime px-3 py-1 text-xs font-bold text-night">Sisa {r.availableRooms}</span>
                      <ChevronRight className="hidden size-5 shrink-0 text-white/40 sm:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Cabang & kamar */}
        <section id="cabang" className="scroll-mt-20 px-3 sm:px-6">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-white px-4 py-12 text-ink sm:rounded-[2.5rem] sm:px-10 sm:py-20">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Cabang <span className="text-brand-600">SmartKos</span>
              </h2>
              <p className="max-w-sm text-ink-soft">Pilih cabang untuk melihat tipe kamar, fasilitas, dan lokasinya.</p>
            </div>

            {/* HP: geser ke samping; md ke atas: grid */}
            <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-auto md:mt-10 md:grid md:max-w-6xl md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-3">
              {kosList.map((k) => (
                <Link key={k.slug} href={`/${k.slug}`} className="group relative block w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl md:w-auto">
                  <img src={k.coverImage ?? ""} alt={k.name} className="aspect-4/5 w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-linear-to-t from-night via-night/40 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-night">{genderLabel[k.gender]}</span>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="flex items-center gap-1 text-sm text-lime">
                      <MapPin className="size-3.5" /> {k.city}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold">{k.name}</h3>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-white/75">
                        Mulai <b className="text-white">{k.minPrice ? price(k.minPrice) : "-"}</b>/bln
                      </p>
                      <span className="grid size-10 place-items-center rounded-full bg-lime text-night transition group-hover:translate-x-1">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {featured.length > 0 && (
              <div className="mx-auto mt-12 max-w-6xl md:mt-16">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h3 className="text-2xl font-bold tracking-tight">Semua tipe kamar</h3>
                  <Link href="/kamar" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                    Lihat semua <ArrowRight className="size-4" />
                  </Link>
                </div>
                <Carousel className="mt-6 min-w-0">
                  {featured.map((r) => (
                    <RoomCard key={r.id} room={r} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]" />
                  ))}
                </Carousel>
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative scroll-mt-20 overflow-hidden">
          <div className="absolute -right-32 top-10 size-80 rounded-full bg-brand-600/25 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-10 lg:py-24">
            <div className="text-center lg:text-left">
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
            <Faq night />
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-white/6">
          <Ornament className="absolute bottom-0 left-1/2 w-56 -translate-x-1/2 opacity-70" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:py-20">
            <div className="text-center lg:text-left">
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
            <HouseFrame src="/uploads/seed/jogja-prem-2.jpg" alt="Kamar SmartKos" className="mx-auto aspect-square w-full max-w-65 sm:max-w-sm" />
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
