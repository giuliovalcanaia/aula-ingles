"use client"

import { useState } from "react"
import { Loader2Icon, SearchIcon } from "lucide-react"

import { fetchLinkPreview } from "@/app/painel/actions"
import { InputGroupButton } from "@/components/ui/input-group"
import { normalizeHttpUrl } from "@/lib/links"

type BuscarNaPaginaButtonProps = {
  href: string
  onTitulo: (titulo: string) => void
  onErro?: (mensagem: string | null) => void
}

/** Lê o título da página do link e preenche o formulário. */
export function BuscarNaPaginaButton({
  href,
  onTitulo,
  onErro,
}: BuscarNaPaginaButtonProps) {
  const [buscando, setBuscando] = useState(false)

  async function buscar() {
    const normalizado = normalizeHttpUrl(href)

    if (!normalizado) {
      onErro?.("Informe um endereço válido antes de buscar na página.")
      return
    }

    setBuscando(true)
    onErro?.(null)

    try {
      const resultado = await fetchLinkPreview(normalizado)

      if (resultado.title) onTitulo(resultado.title)

      if (!resultado.title) {
        onErro?.(
          resultado.error === "unauthorized"
            ? "Sessão expirada. Entre novamente."
            : resultado.error === "invalid_url"
              ? "Endereço inválido para buscar na página."
              : "Não conseguimos ler esta página. Preencha manualmente."
        )
      }
    } catch {
      onErro?.("Não conseguimos ler esta página. Preencha manualmente.")
    } finally {
      setBuscando(false)
    }
  }

  return (
    <InputGroupButton
      type="button"
      size="xs"
      onClick={buscar}
      disabled={buscando || !href.trim()}
      aria-label="Buscar título na página"
    >
      {buscando ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
      {buscando ? "Buscando" : "Buscar na página"}
    </InputGroupButton>
  )
}
