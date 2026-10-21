"use client"

import { useState } from "react"
import { Loader2Icon, SearchIcon } from "lucide-react"

import { fetchLinkTitle } from "@/app/painel/actions"
import { InputGroupButton } from "@/components/ui/input-group"
import { normalizeHttpUrl } from "@/lib/links"

type BuscarTituloButtonProps = {
  href: string
  onTitulo: (titulo: string) => void
  onErro?: (mensagem: string | null) => void
}

/** Botão que lê o `<title>` da página e preenche o título do link. */
export function BuscarTituloButton({
  href,
  onTitulo,
  onErro,
}: BuscarTituloButtonProps) {
  const [buscando, setBuscando] = useState(false)

  async function buscarTitulo() {
    const normalizado = normalizeHttpUrl(href)

    if (!normalizado) {
      onErro?.("Informe um endereço válido antes de buscar o título.")
      return
    }

    setBuscando(true)
    onErro?.(null)

    try {
      const resultado = await fetchLinkTitle(normalizado)

      if (resultado.title) {
        onTitulo(resultado.title)
        return
      }

      onErro?.(
        resultado.error === "unauthorized"
          ? "Sessão expirada. Entre novamente."
          : resultado.error === "invalid_url"
            ? "Endereço inválido para buscar o título."
            : "Não conseguimos ler o título desta página. Digite manualmente."
      )
    } catch {
      onErro?.("Não conseguimos ler o título desta página. Digite manualmente.")
    } finally {
      setBuscando(false)
    }
  }

  return (
    <InputGroupButton
      type="button"
      size="xs"
      onClick={buscarTitulo}
      disabled={buscando || !href.trim()}
      aria-label="Buscar título da página"
    >
      {buscando ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
      {buscando ? "Buscando" : "Buscar título"}
    </InputGroupButton>
  )
}
