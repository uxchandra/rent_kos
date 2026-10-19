"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BedDouble,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/auth-provider";

// `ready: false` = menu untuk tahap berikutnya, belum bisa diklik.
const menu = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/admin/kos", label: "Kos", icon: Building2, ready: false, ownerOnly: true },
  { href: "/admin/kamar", label: "Kamar", icon: BedDouble, ready: false },
  { href: "/admin/booking", label: "Booking", icon: ClipboardList, ready: false },
  { href: "/admin/penghuni", label: "Penghuni", icon: Users, ready: false },
  { href: "/admin/tagihan", label: "Tagihan", icon: ReceiptText, ready: false },
  { href: "/admin/pembayaran", label: "Pembayaran", icon: CreditCard, ready: false },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3, ready: false },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings, ready: false, ownerOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = menu.filter((m) => !m.ownerOnly || user.role === "OWNER");

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-brand-100 bg-white p-4 md:flex">
        <div className="px-2 py-2">
          <Logo href="/admin" />
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1 text-sm font-medium">
          {items.map(({ href, label, icon: Icon, ready }) => {
            const active = pathname === href;
            const cls = `flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
              active ? "bg-brand-600 text-white shadow-md shadow-brand-600/25" : "text-muted hover:bg-brand-50 hover:text-brand-800"
            }`;
            return ready ? (
              <Link key={href} href={href} className={cls}>
                <Icon className="size-4" /> {label}
              </Link>
            ) : (
              <span key={href} className={`${cls} cursor-not-allowed opacity-50`} title="Segera hadir">
                <Icon className="size-4" /> {label}
                <span className="ml-auto rounded bg-brand-50 px-1.5 text-[10px] text-brand-700">soon</span>
              </span>
            );
          })}
        </nav>
        <div className="rounded-2xl bg-surface p-3">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-muted">{user.role === "OWNER" ? "Owner" : `Admin · ${user.kos.map((k) => k.name).join(", ")}`}</p>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 hover:underline">
            <LogOut className="size-3.5" /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-brand-100 bg-white px-4 md:hidden">
          <Logo href="/admin" />
          <button onClick={logout} className="text-sm font-semibold text-red-600">
            Keluar
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
