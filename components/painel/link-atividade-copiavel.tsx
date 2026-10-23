"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { toast } from "@/components/ui/toast"

/** Código de entrada que copia o link completo da atividade ao ser clicado. */
export function LinkAtividadeCopiavel({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  async function copiar() {
    // O origin acompanha o ambiente: localhost no dev, domínio da Vercel em
    // produção (inclusive previews).
    const link = `${window.location.origin}/atividade?codigo=${encodeURIComponent(codigo)}`

    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      toast.add({
        type: "success",
        title: "Link da atividade copiado.",
        description: link,
      })

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.add({
        type: "error",
        title: "Não foi possível copiar o link.",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title={copiado ? "Link copiado" : "Copiar link da atividade"}
      aria-label={`Copiar link da atividade ${codigo}`}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-sm font-semibold transition-colors hover:bg-muted-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"
    >
      {copiado ? (
        <CheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CopyIcon className="size-4" />
      )}
      {codigo}
    </button>
  )
}
