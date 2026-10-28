"use client"

import Link from "next/link"
import { ExternalLinkIcon, KeyRoundIcon, LogOutIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

/** Menu profil di kanan navbar admin: avatar sebagai tombol, isi dropdown akun & keluar. */
export function NavUser({ user, onLogout }: { user: { name: string; email: string }; onLogout: () => void }) {
  const avatar = (
    <Avatar className="size-8 rounded-lg">
      <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
    </Avatar>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-2 px-1.5 py-1" aria-label="Menu profil">
          {avatar}
          <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            {avatar}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/admin/akun">
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
  )
}
