"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ExternalLinkIcon, FolderIcon, Trash2Icon } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useSelecao } from "@/components/painel/selecao-context"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { flattenPastas, type PastaRow } from "@/lib/pastas"
import { itemKey } from "@/lib/selecao"
import { cn } from "@/lib/utils"

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
  const router = useRouter()
  const { selecionados, selecionar } = useSelecao()
  const arvore = flattenPastas(pastas)
  const chavesPastas = arvore.map((pasta) =>
    itemKey({ tipo: "pasta", id: pasta.id })
  )

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
              const chave = itemKey({ tipo: "pasta", id: pasta.id })
              const selecionada = selecionados.has(chave)

              function selecionarPasta(mods?: {
                ctrl?: boolean
                shift?: boolean
              }) {
                selecionar(chave, {
                  ctrl: mods?.ctrl,
                  shift: mods?.shift,
                  ordem: chavesPastas,
                })
              }

              return (
                <SidebarMenuItem key={pasta.id}>
                  <ContextMenu>
                    <ContextMenuTrigger className="block">
                      <SidebarMenuButton
                        type="button"
                        isActive={pathname === url && !selecionada}
                        tooltip={pasta.nome}
                        data-selected={selecionada}
                        aria-pressed={selecionada}
                        className={cn(
                          selecionada &&
                            "bg-accent text-accent-foreground ring-1 ring-primary/30 ring-inset hover:bg-accent hover:text-accent-foreground"
                        )}
                        style={{
                          paddingLeft: `${8 + pasta.depth * 14}px`,
                        }}
                        onClick={(event) =>
                          selecionarPasta({
                            ctrl: event.metaKey || event.ctrlKey,
                            shift: event.shiftKey,
                          })
                        }
                        onDoubleClick={() => router.push(url)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault()
                            router.push(url)
                            return
                          }

                          if (event.key === " ") {
                            event.preventDefault()
                            selecionarPasta({ ctrl: true })
                          }
                        }}
                      >
                        <FolderIcon />
                        <span className="truncate">{pasta.nome}</span>
                      </SidebarMenuButton>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuGroup>
                        <ContextMenuItem onClick={() => router.push(url)}>
                          <ExternalLinkIcon />
                          Abrir
                        </ContextMenuItem>
                      </ContextMenuGroup>
                    </ContextMenuContent>
                  </ContextMenu>
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
