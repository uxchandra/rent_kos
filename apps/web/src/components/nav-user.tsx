"use client"

import Link from "next/link"
import { ChevronsUpDownIcon, ExternalLinkIcon, KeyRoundIcon, LogOutIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

export function NavUser({ user, onLogout }: { user: { name: string; email: string }; onLogout: () => void }) {
  const { isMobile, setOpenMobile } = useSidebar()

  const avatar = (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary">{initials(user.name)}</AvatarFallback>
    </Avatar>
  )
  const identity = (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{user.name}</span>
      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
    </div>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              {avatar}
              {identity}
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {avatar}
                {identity}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin/akun" onClick={() => setOpenMobile(false)}>
                  <KeyRoundIcon />
                  Akun saya
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/" target="_blank" rel="noopener">
                  <ExternalLinkIcon />
                  Lihat website
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onLogout}>
              <LogOutIcon />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
