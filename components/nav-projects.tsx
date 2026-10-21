"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ChevronRightIcon, FolderIcon, Trash2Icon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  flattenPastasVisiveis,
  pastaBreadcrumb,
  type PastaRow,
} from "@/lib/pastas"
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
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set())

  const pastaAtualId = useMemo(() => {
    const match = pathname.match(/^\/painel\/pastas\/(\d+)/)
    return match ? Number(match[1]) : null
  }, [pathname])

  // Mantém visível o caminho até a pasta atual (inclusive ela).
  useEffect(() => {
    if (pastaAtualId === null) return

    const caminho = pastaBreadcrumb(pastas, pastaAtualId)

    setExpandidas((anterior) => {
      const proximo = new Set(anterior)
      for (const pasta of caminho) proximo.add(pasta.id)
      return proximo
    })
  }, [pastaAtualId, pastas])

  const arvore = flattenPastasVisiveis(pastas, expandidas)

  const comFilhos = useMemo(
    () =>
      new Set(
        pastas.flatMap((pasta) =>
          pasta.parent_id === null ? [] : [pasta.parent_id]
        )
      ),
    [pastas]
  )

  function alternarPasta(id: number) {
    setExpandidas((anterior) => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

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
              const temFilhos = comFilhos.has(pasta.id)
              const aberta = expandidas.has(pasta.id)

              return (
                <SidebarMenuItem key={pasta.id}>
                  <SidebarMenuButton
                    type="button"
                    isActive={pathname === url}
                    tooltip={pasta.nome}
                    aria-expanded={temFilhos ? aberta : undefined}
                    style={{
                      paddingLeft: `${8 + pasta.depth * 14}px`,
                    }}
                    onClick={(event) => {
                      if (event.detail === 1 && temFilhos) {
                        alternarPasta(pasta.id)
                      }

                      router.push(url)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight" && temFilhos && !aberta) {
                        event.preventDefault()
                        alternarPasta(pasta.id)
                        return
                      }

                      if (event.key === "ArrowLeft" && temFilhos && aberta) {
                        event.preventDefault()
                        alternarPasta(pasta.id)
                      }
                    }}
                  >
                    {temFilhos ? (
                      <ChevronRightIcon
                        className={cn(
                          "shrink-0 transition-transform",
                          aberta && "rotate-90"
                        )}
                      />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden="true" />
                    )}
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
