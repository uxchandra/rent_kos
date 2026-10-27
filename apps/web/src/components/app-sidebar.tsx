"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  BarChart3Icon,
  BedDoubleIcon,
  Building2Icon,
  ClipboardListIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  ReceiptTextIcon,
  UserCogIcon,
  ShieldCheckIcon,
  HistoryIcon,
  UsersIcon,
} from "lucide-react"
import { NavMain, type NavItem } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { site } from "@/lib/site"
import { waLink } from "@/lib/format"
import type { AdminKosSummary, Dashboard } from "@/lib/admin-types"
import { allowed, pageAccess } from "@/lib/access"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, logout, can, isOwner } = useAuth()
  const { data: kos } = useSWR<{ data: AdminKosSummary[] }>("/admin/kos")
  const { data: dashboard } = useSWR<{ data: Dashboard }>(can("dashboard.view") ? "/admin/dashboard" : null)
  const branches = kos?.data ?? []
  // Tampilkan menu hanya bila halamannya boleh dibuka (aturan sama dengan pengaman halaman).
  const visible = (items: NavItem[]) => items.filter((i) => allowed(pageAccess(i.url), { isOwner, can }))

  const operasional = visible([
    { title: "Dashboard", url: "/admin", icon: <LayoutDashboardIcon /> },
    { title: "Papan kamar", url: "/admin/kamar", icon: <BedDoubleIcon /> },
    { title: "Booking", url: "/admin/booking", icon: <ClipboardListIcon />, badge: dashboard?.data.totals.pendingBookings },
    { title: "Penghuni", url: "/admin/penghuni", icon: <UsersIcon /> },
    { title: "Tagihan", url: "/admin/tagihan", icon: <ReceiptTextIcon /> },
    { title: "Pembayaran", url: "/admin/pembayaran", icon: <CreditCardIcon /> },
  ])

  const kelola = visible([
    {
      title: "Cabang",
      url: "/admin/kos",
      icon: <Building2Icon />,
      items: [
        { title: "Semua cabang", url: "/admin/kos", exact: true },
        ...(can("kos.view")
          ? branches.map((b) => ({
              title: b.name.replace("SmartKos ", ""),
              url: `/admin/kos/${b.id}`,
              meta: !b.isPublished ? "draf" : b.comingSoon ? "segera" : `${b.availableRooms} kosong`,
            }))
          : []),
        ...(isOwner ? [{ title: "Tambah cabang", url: "/admin/kos/baru", exact: true }] : []),
      ],
    },
    { title: "Laporan", url: "/admin/laporan", icon: <BarChart3Icon /> },
  ])

  const akses: NavItem[] = isOwner
    ? [
        { title: "Pengguna", url: "/admin/pengguna", icon: <UserCogIcon /> },
        { title: "Peran & izin", url: "/admin/peran", icon: <ShieldCheckIcon /> },
        { title: "Log aktivitas", url: "/admin/aktivitas", icon: <HistoryIcon /> },
      ]
    : []

  const secondary = [
    { title: "Lihat website", url: "/", icon: <ExternalLinkIcon />, external: true },
    { title: "Bantuan teknis", url: waLink(site.whatsapp, "Halo, saya butuh bantuan di admin panel SmartKos."), icon: <MessageCircleIcon />, external: true },
  ]

  const roleLabel = isOwner ? "Owner · semua cabang" : `${user.staffRole?.name ?? "Admin"} · ${user.kos.map((k) => k.name.replace("SmartKos ", "")).join(", ") || "belum ada cabang"}`

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
                    <path d="M16 4 4 14v13a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1V14z" className="fill-current" />
                    <path d="M12 28v-7a4 4 0 0 1 8 0v7z" className="fill-sidebar-primary" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SmartKos</span>
                  <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {operasional.length > 0 && <NavMain label="Operasional" items={operasional} />}
        {kelola.length > 0 && <NavMain label="Kelola" items={kelola} />}
        {akses.length > 0 && <NavMain label="Pengguna & akses" items={akses} />}
        <NavSecondary items={secondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
