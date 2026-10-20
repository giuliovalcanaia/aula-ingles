"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderIcon, Trash2Icon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { flattenPastas, type PastaRow } from "@/lib/pastas"

export function NavProjects({
  items,
  pastas,
  trashCount,
}: {
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
  pastas: PastaRow[]
  trashCount: number
}) {
  const pathname = usePathname()
  const arvore = flattenPastas(pastas)

  return (
    <>
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

      {arvore.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Pastas</SidebarGroupLabel>
          <SidebarMenu>
            {arvore.map((pasta) => {
              const url = `/painel/pastas/${pasta.id}`
              return (
                <SidebarMenuItem key={pasta.id}>
                  <SidebarMenuButton
                    isActive={pathname === url}
                    tooltip={pasta.nome}
                    render={<Link href={url} />}
                    style={{ paddingLeft: `${8 + pasta.depth * 14}px` }}
                  >
                    <FolderIcon />
                    <span className="truncate">{pasta.nome}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      )}

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/painel/lixeira")}
              tooltip="Lixeira"
              render={<Link href="/painel/lixeira" />}
            >
              <Trash2Icon />
              <span>Lixeira</span>
            </SidebarMenuButton>
            {trashCount > 0 && (
              <SidebarMenuBadge>{trashCount}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
