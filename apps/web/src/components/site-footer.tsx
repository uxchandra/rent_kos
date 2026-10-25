import Link from "next/link";
import { Logo } from "./logo";
import { getKosList } from "@/lib/public-api";
import { site } from "@/lib/site";

export async function SiteFooter() {
  "use cache";
  const kosList = await getKosList();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-night text-sm text-white/70">
      {/* HP: rata tengah seperti landing page; sm ke atas: kolom rata kiri */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-center sm:grid-cols-2 sm:px-6 sm:text-left lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex flex-col items-center sm:items-start">
          <Logo light />
          <p className="mt-4 max-w-xs leading-relaxed">
            Kos bulanan di {[...new Set(kosList.map((k) => k.city))].join(", ")}, dikelola langsung oleh tim SmartKos.
          </p>
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
          <h3 className="font-semibold text-white">Penghuni</h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/kamar" className="hover:text-white">
                Cari kamar
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Masuk akun
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-white">
                Pertanyaan umum
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white">Hubungi kami</h3>
          <ul className="mt-4 space-y-2.5">
            <li>WhatsApp {site.phoneDisplay}</li>
            <li>{site.email}</li>
            <li>{site.hours}</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">
        © {year} PT Smart Kos Indonesia
      </p>
    </footer>
  );
}
