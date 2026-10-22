"use client"

import type { ReactNode } from "react"

import { useLinksDraft } from "@/components/painel/links-draft"
import { Tabs } from "@/components/ui/tabs"

type LinksProtectedTabsProps = {
  className?: string
  children: ReactNode
}

/** Abas da atividade: trocar de aba com o rascunho sujo pede confirmação. */
export function LinksProtectedTabs({
  className,
  children,
}: LinksProtectedTabsProps) {
  const { abaAtiva, setAbaAtiva, dirty, pedirAcao } = useLinksDraft()

  return (
    <Tabs
      value={abaAtiva}
      onValueChange={(valor) => {
        if (valor == null) return

        const nova = String(valor)
        if (nova === abaAtiva) return

        if (dirty) {
          pedirAcao({ type: "tab", value: nova })
          return
        }

        setAbaAtiva(nova)
      }}
      className={className}
    >
      {children}
    </Tabs>
  )
}
