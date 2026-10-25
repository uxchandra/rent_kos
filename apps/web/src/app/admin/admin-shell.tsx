"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR, { SWRConfig } from "swr";
import { BedDoubleIcon, Building2Icon, LayoutDashboardIcon, MenuIcon, ReceiptTextIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { isActivePath } from "@/components/nav-main";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FeedbackProvider } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import type { AdminKosSummary } from "@/lib/admin-types";
import { useAuth } from "@/components/auth-provider";
import { allowed, pageAccess } from "@/lib/access";
import { ShieldAlertIcon } from "lucide-react";

const segmentLabel: Record<string, string> = {
  kamar: "Papan kamar",
  kos: "Cabang",
  baru: "Tambah cabang",
  booking: "Booking",
  penghuni: "Penghuni",
  tagihan: "Tagihan",
  pembayaran: "Pembayaran",
  laporan: "Laporan",
  pengelola: "Pengelola",
  akun: "Akun saya",
  pengguna: "Pengguna",
  peran: "Peran & izin",
  aktivitas: "Log aktivitas",
};

function AdminBreadcrumb() {
  const pathname = usePathname();
  const { data: kos } = useSWR<{ data: AdminKosSummary[] }>("/admin/kos");
  const segments = pathname.split("/").filter(Boolean).slice(1); // tanpa "admin"

  const crumbs = segments.map((seg, i) => {
    const href = `/admin/${segments.slice(0, i + 1).join("/")}`;
    const kosName = segments[i - 1] === "kos" && /^\d+$/.test(seg) ? kos?.data.find((k) => k.id === Number(seg))?.name : undefined;
    return { href, label: kosName ?? segmentLabel[seg] ?? "Detail" };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className={crumbs.length ? "hidden md:block" : ""}>
          {crumbs.length ? (
            <BreadcrumbLink asChild>
              <Link href="/admin">Dashboard</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {crumbs.map((c, i) => (
          <Fragment key={c.href}>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden md:block" : ""}>
              {i < crumbs.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="max-w-[60vw] truncate">{c.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const shortcuts = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/kamar", label: "Papan kamar" },
  { href: "/admin/booking", label: "Booking" },
  { href: "/admin/penghuni", label: "Penghuni" },
  { href: "/admin/tagihan", label: "Tagihan" },
  { href: "/admin/pembayaran", label: "Pembayaran" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/kos", label: "Cabang" },
];

/** Tampilkan halaman hanya bila peran user mengizinkan; selain itu pesan + tautan ke halaman yang boleh. */
function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isOwner, can } = useAuth();
  if (allowed(pageAccess(pathname), { isOwner, can })) return children;

  const open = shortcuts.filter((s) => allowed(pageAccess(s.href), { isOwner, can }));
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <ShieldAlertIcon className="mx-auto size-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-bold">Halaman ini tidak tersedia untuk Anda</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Peran <b>{user.staffRole?.name ?? "Anda"}</b> tidak punya izin membuka halaman ini. Minta Owner menambahkan izinnya jika memang dibutuhkan.
      </p>
      {open.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {open.map((s) => (
            <Link key={s.href} href={s.href} className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:border-primary hover:text-primary">
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const mobileTabs = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/kamar", label: "Kamar", icon: BedDoubleIcon },
  { href: "/admin/tagihan", label: "Tagihan", icon: ReceiptTextIcon },
  { href: "/admin/kos", label: "Cabang", icon: Building2Icon },
];

/** Tab bawah di HP untuk menu yang paling sering dipakai; "Menu" membuka sidebar. */
function MobileTabBar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { isOwner, can } = useAuth();
  const tabs = mobileTabs.filter((t) => allowed(pageAccess(t.href), { isOwner, can }));
  return (
    <nav style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }} className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
            {label}
          </Link>
        );
      })}
      <button onClick={() => setOpenMobile(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground">
        <MenuIcon className="size-5" /> Menu
      </button>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher: (path: string) => api(path), revalidateOnFocus: true }}>
      <FeedbackProvider>
        <TooltipProvider delayDuration={0}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur md:rounded-t-xl">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <AdminBreadcrumb />
              </header>
              <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
                <PageGuard>{children}</PageGuard>
              </main>
            </SidebarInset>
            <MobileTabBar />
          </SidebarProvider>
        </TooltipProvider>
      </FeedbackProvider>
    </SWRConfig>
  );
}
