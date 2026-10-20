"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavProjects({
  items,
}: {
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Painel</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active =
            item.url === "/painel"
              ? pathname === "/painel"
              : pathname.startsWith(item.url)

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                isActive={active}
                tooltip={item.name}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
