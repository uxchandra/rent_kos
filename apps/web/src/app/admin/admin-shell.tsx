"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SWRConfig } from "swr";
import {
  BarChart3,
  BedDouble,
  Building2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ReceiptText,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/auth-provider";
import { BottomSheet } from "@/components/bottom-sheet";
import { FeedbackProvider } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type MenuItem = { href: string; label: string; icon: LucideIcon; ready: boolean; ownerOnly?: boolean };

// `ready: false` = fitur tahap berikutnya.
const menu: MenuItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/admin/kamar", label: "Papan kamar", icon: BedDouble, ready: true },
  { href: "/admin/kos", label: "Cabang", icon: Building2, ready: true },
  { href: "/admin/booking", label: "Booking", icon: ClipboardList, ready: false },
  { href: "/admin/penghuni", label: "Penghuni", icon: Users, ready: false },
  { href: "/admin/tagihan", label: "Tagihan", icon: ReceiptText, ready: false },
  { href: "/admin/pembayaran", label: "Pembayaran", icon: CreditCard, ready: false },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3, ready: false },
  { href: "/admin/pengelola", label: "Pengelola", icon: UserCog, ready: true, ownerOnly: true },
  { href: "/admin/akun", label: "Akun saya", icon: KeyRound, ready: true },
];

const mobileTabs = ["/admin", "/admin/kamar", "/admin/kos"];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

function NavLink({ item, pathname, onClick }: { item: MenuItem; pathname: string; onClick?: () => void }) {
  const { href, label, icon: Icon, ready } = item;
  const active = isActive(pathname, href);
  const cls = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    active ? "bg-lavender text-brand-700" : "text-muted hover:bg-subtle hover:text-ink"
  }`;
  if (!ready) {
    return (
      <span className={`${cls} cursor-not-allowed opacity-50`} title="Segera hadir">
        <Icon className="size-[18px]" /> {label}
        <span className="ml-auto rounded bg-subtle px-1.5 text-[10px] font-semibold">soon</span>
      </span>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={cls}>
      <Icon className="size-[18px]" /> {label}
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = menu.filter((m) => !m.ownerOnly || user.role === "OWNER");
  const roleLabel = user.role === "OWNER" ? "Owner" : `Admin · ${user.kos.map((k) => k.name).join(", ") || "belum ada cabang"}`;

  return (
    <SWRConfig value={{ fetcher: (path: string) => api(path), revalidateOnFocus: true }}>
      <FeedbackProvider>
        <div className="flex min-h-dvh bg-subtle">
          {/* Sidebar desktop */}
          <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white p-4 lg:flex">
            <div className="flex items-center justify-between px-2 py-2">
              <Logo href="/admin" />
              <span className="rounded-md bg-lavender px-1.5 py-0.5 text-[10px] font-bold text-brand-700">ADMIN</span>
            </div>
            <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
            <a href="/" target="_blank" className="mb-3 flex items-center gap-2 px-3 text-xs font-medium text-muted hover:text-brand-600">
              <ExternalLink className="size-3.5" /> Lihat website
            </a>
            <div className="rounded-2xl bg-cream p-3">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted">{roleLabel}</p>
              <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 hover:underline">
                <LogOut className="size-3.5" /> Keluar
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Top bar HP */}
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
              <Logo href="/admin" />
              <span className="grid size-9 place-items-center rounded-full bg-lavender text-sm font-bold text-brand-700">{user.name[0]}</span>
            </header>

            <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">{children}</main>
          </div>

          {/* Tab bawah HP */}
          <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
            {mobileTabs.map((href) => {
              const item = menu.find((m) => m.href === href)!;
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-brand-600" : "text-muted"}`}
                >
                  <item.icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label === "Papan kamar" ? "Kamar" : item.label}
                </Link>
              );
            })}
            <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted">
              <MoreHorizontal className="size-5" /> Lainnya
            </button>
          </nav>
          <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
            <div className="mb-4 rounded-2xl bg-cream p-4">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted">{roleLabel}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              {items
                .filter((m) => !mobileTabs.includes(m.href))
                .map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setMoreOpen(false)} />
                ))}
              <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted">
                <ExternalLink className="size-[18px]" /> Lihat website
              </a>
              <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600">
                <LogOut className="size-[18px]" /> Keluar
              </button>
            </div>
          </BottomSheet>
        </div>
      </FeedbackProvider>
    </SWRConfig>
  );
}
