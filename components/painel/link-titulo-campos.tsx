"use client"

import { useEffect, useRef, useState } from "react"

import { BuscarTituloButton } from "@/components/painel/buscar-titulo-button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"

type LinkTituloCamposProps = {
  tituloId: string
  hrefId: string
  tituloInicial?: string
  hrefInicial?: string
}

/** Título e URL de um link, com busca automática do título da página. */
export function LinkTituloCampos({
  tituloId,
  hrefId,
  tituloInicial = "",
  hrefInicial = "",
}: LinkTituloCamposProps) {
  const [titulo, setTitulo] = useState(tituloInicial)
  const [href, setHref] = useState(hrefInicial)
  const [erro, setErro] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Os campos são controlados; o reset do <form> (após salvar) precisa limpar
  // o estado também.
  useEffect(() => {
    const form = containerRef.current?.closest("form")
    if (!form) return

    function limpar() {
      setTitulo(tituloInicial)
      setHref(hrefInicial)
      setErro(null)
    }

    form.addEventListener("reset", limpar)
    return () => form.removeEventListener("reset", limpar)
  }, [tituloInicial, hrefInicial])

  return (
    <div ref={containerRef} className="contents">
      <div className="space-y-2">
        <Label htmlFor={tituloId}>Título</Label>
        <Input
          id={tituloId}
          name="titulo"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Ex.: Exercise 1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={hrefId}>URL</Label>
        <InputGroup>
          <InputGroupInput
            id={hrefId}
            name="href"
            type="text"
            inputMode="url"
            value={href}
            onChange={(event) => {
              setHref(event.target.value)
              setErro(null)
            }}
            placeholder="google.com ou https://..."
            required
          />
          <InputGroupAddon align="inline-end">
            <BuscarTituloButton
              href={href}
              onTitulo={setTitulo}
              onErro={setErro}
            />
          </InputGroupAddon>
        </InputGroup>
        {erro ? (
          <p className="text-xs text-destructive">{erro}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Pode digitar sem https://. Use “Buscar título” para preencher
            automaticamente.
          </p>
        )}
      </div>
    </div>
  )
}
