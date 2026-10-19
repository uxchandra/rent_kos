import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { Logo } from "./logo";
import { site } from "@/lib/site";
import { waLink } from "@/lib/format";

export function SiteHeader({ searchLabel = "Cari kos di kota tujuanmu", wide = true }: { searchLabel?: string; wide?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className={`mx-auto flex h-20 items-center justify-between gap-4 px-4 sm:px-6 ${wide ? "max-w-350" : "max-w-6xl"}`}>
        <Logo />

        <Link
          href="/#kamar"
          className="hidden items-center gap-3 rounded-full border border-line py-2 pl-5 pr-2 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.08),0_4px_12px_rgb(0_0_0/0.05)] transition hover:shadow-md md:flex"
        >
          <span className="font-semibold">Lokasi</span>
          <span className="h-5 w-px bg-line" />
          <span className="text-muted">{searchLabel}</span>
          <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-white">
            <Search className="size-4" strokeWidth={2.5} />
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <a
            href={waLink(site.whatsapp, "Halo SmartKos, saya mau tanya soal kamar.")}
            target="_blank"
            rel="noopener"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-subtle lg:block"
          >
            Hubungi kami
          </a>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-3 pr-1.5 text-sm font-semibold transition hover:shadow-md"
          >
            Masuk
            <span className="grid size-7 place-items-center rounded-full bg-muted text-white">
              <UserRound className="size-4" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
