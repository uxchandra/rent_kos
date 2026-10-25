"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  badge?: number
  items?: { title: string; url: string; meta?: string; exact?: boolean }[]
}

/** Halaman aktif: `/admin` harus persis, menu lain cocok dengan awalan path-nya. */
export const isActivePath = (pathname: string, url: string) =>
  url === "/admin" ? pathname === url : pathname === url || pathname.startsWith(`${url}/`)

export function NavMain({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = isActivePath(pathname, item.url)
          return (
            <Collapsible key={item.title} asChild defaultOpen={active}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={active && pathname === item.url}>
                  <Link href={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge ? <SidebarMenuBadge className="bg-primary text-primary-foreground">{item.badge}</SidebarMenuBadge> : null}
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRightIcon />
                        <span className="sr-only">Buka submenu</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild isActive={sub.exact ? pathname === sub.url : isActivePath(pathname, sub.url)}>
                              <Link href={sub.url} onClick={() => setOpenMobile(false)}>
                                <span>{sub.title}</span>
                                {sub.meta && <span className="ml-auto text-xs text-muted-foreground">{sub.meta}</span>}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
