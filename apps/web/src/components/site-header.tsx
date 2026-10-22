import Link from "next/link";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

const nav = [
  { href: "/#cabang", label: "Cabang" },
  { href: "/#kenapa", label: "Kenapa SmartKos" },
  { href: "/#faq", label: "Bantuan" },
];

const mobileLinks = [{ href: "/kamar", label: "Cari kamar" }, ...nav];

export function SiteHeader() {
  return (
    <>
      <p className="bg-brand-600 px-4 py-1.5 text-center text-xs font-medium text-white">
        <span className="sm:hidden">Bayar hanya ke rekening PT Smart Kos Indonesia.</span>
        <span className="hidden sm:inline">Penting: pembayaran resmi hanya ke rekening atas nama PT Smart Kos Indonesia.</span>
      </p>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/kamar"
              className="rounded-full border border-brand-600 px-4 py-2 font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white"
            >
              Lihat kamar
            </Link>
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hidden rounded-full px-3 py-2 text-muted hover:text-ink md:block">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="hidden rounded-full px-3 py-2 text-muted hover:text-ink md:block">
              Masuk
            </Link>
            <MobileMenu links={mobileLinks} />
          </nav>
        </div>
      </header>
    </>
  );
}
