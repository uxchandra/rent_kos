import Link from "next/link";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

const nav = [
  { href: "/#cabang", label: "Cabang" },
  { href: "/#cara-sewa", label: "Cara sewa" },
  { href: "/#faq", label: "FAQ" },
];

const mobileLinks = [{ href: "/kamar", label: "Cari kamar" }, ...nav];

/** `night` = versi gelap untuk landing page. */
export function SiteHeader({ night = false }: { night?: boolean }) {
  return (
    <>
      <p className={`px-4 py-1.5 text-center text-xs font-medium ${night ? "bg-night-2 text-lime-soft" : "bg-brand-600 text-white"}`}>
        <span className="sm:hidden">Bayar hanya ke rekening PT Smart Kos Indonesia.</span>
        <span className="hidden sm:inline">Penting: pembayaran resmi hanya ke rekening atas nama PT Smart Kos Indonesia.</span>
      </p>
      <header className={`sticky top-0 z-40 border-b ${night ? "border-white/10 bg-night/90 text-white backdrop-blur-md" : "border-line bg-white"}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo night={night} />
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`hidden rounded-full px-3 py-2 md:block ${night ? "text-white/75 hover:text-white" : "text-ink-soft hover:text-ink"}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className={`hidden rounded-full px-3 py-2 md:block ${night ? "text-white/75 hover:text-white" : "text-ink-soft hover:text-ink"}`}
            >
              Masuk
            </Link>
            <Link
              href="/kamar"
              className={`ml-1 rounded-full border px-4 py-2 font-semibold transition ${
                night
                  ? "border-lime text-lime hover:bg-lime hover:text-night"
                  : "border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white"
              }`}
            >
              Lihat kamar
            </Link>
            <MobileMenu links={mobileLinks} />
          </nav>
        </div>
      </header>
    </>
  );
}
