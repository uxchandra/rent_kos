"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, MessageCircle, X } from "lucide-react";
import { Logo } from "./logo";
import { site } from "@/lib/site";
import { waLink } from "@/lib/format";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Tutup menu setiap pindah halaman.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="-mr-2 ml-1 rounded-full p-2 hover:bg-current/10 md:hidden" aria-label="Buka menu">
        <Menu className="size-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden" role="dialog" aria-modal aria-label="Menu">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo />
            <button onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2 hover:bg-subtle" aria-label="Tutup menu">
              <X className="size-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-4 text-lg font-semibold"
              >
                {l.label} <ChevronRight className="size-5 text-ink-soft" />
              </Link>
            ))}
          </nav>
          <div className="space-y-3 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
            <a
              href={waLink(site.whatsapp, "Halo SmartKos, saya mau tanya soal kamar.")}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-center gap-2 rounded-full border border-line py-3.5 font-semibold"
            >
              <MessageCircle className="size-5" /> Chat WhatsApp
            </a>
            <Link href="/login" className="block rounded-full bg-brand-600 py-3.5 text-center font-semibold text-white">
              Login
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
