import Link from "next/link";
import { Logo } from "./logo";
import { getKosList } from "@/lib/public-api";
import { waLink } from "@/lib/format";
import { site } from "@/lib/site";

const quickLinks = [
  { href: "/kamar", label: "Cari kamar" },
  { href: "/#cara-sewa", label: "Cara sewa" },
  { href: "/#faq", label: "Pertanyaan umum" },
  { href: "/login", label: "Login" },
];

export async function SiteFooter() {
  "use cache";
  const kosList = await getKosList();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/6 bg-night text-sm text-white/70">
      {/* HP & tablet: logo dan kontak selebar layar, Cabang + Akses cepat berdampingan 2 kolom; desktop: 4 kolom */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-9 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10 lg:py-14">
        <div className="col-span-2 lg:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs leading-relaxed">Tempat pulang yang nyaman, di kota mana pun kamu.</p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Cabang</h3>
          <ul className="mt-4 space-y-2.5">
            {kosList.map((k) => (
              <li key={k.slug}>
                <Link href={`/${k.slug}`} className="hover:text-white">
                  {k.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white">Akses cepat</h3>
          <ul className="mt-4 space-y-2.5">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <h3 className="font-semibold text-white">Hubungi kami</h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a href={waLink(site.whatsapp, "Halo SmartKos, saya mau bertanya.")} target="_blank" rel="noopener" className="hover:text-white">
                WhatsApp {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li>{site.hours}</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">
        © {year} SmartKos
      </p>
    </footer>
  );
}
