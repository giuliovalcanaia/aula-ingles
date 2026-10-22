"use client"

import { useEffect, useRef, useState } from "react"

import { BuscarNaPaginaButton } from "@/components/painel/buscar-na-pagina-button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"

type LinkFieldsProps = {
  link?: {
    id: number
    titulo: string
    href: string
  }
  /** Id do formulário que recebe estes campos (quando não há um form pai). */
  form?: string
}

/** Campos de título e URL de um link. */
export function LinkFields({ link, form }: LinkFieldsProps) {
  const [titulo, setTitulo] = useState(link?.titulo ?? "")
  const [href, setHref] = useState(link?.href ?? "")
  const [erro, setErro] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sufixo = link ? String(link.id) : "novo"

  // O form que recebe estes campos pode estar fora da árvore (atributo `form`).
  useEffect(() => {
    const container = containerRef.current
    const formElement = form
      ? document.getElementById(form)
      : container?.closest("form")
    if (!formElement) return

    function limpar() {
      setTitulo(link?.titulo ?? "")
      setHref(link?.href ?? "")
      setErro(null)
    }

    formElement.addEventListener("reset", limpar)
    return () => formElement.removeEventListener("reset", limpar)
  }, [form, link?.titulo, link?.href])

  return (
    <div ref={containerRef} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`titulo-${sufixo}`}>Título</Label>
        <Input
          id={`titulo-${sufixo}`}
          name={link ? `titulo-${link.id}` : "titulo"}
          form={form}
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Ex.: Exercise 1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`href-${sufixo}`}>URL</Label>
        <InputGroup>
          <InputGroupInput
            id={`href-${sufixo}`}
            name={link ? `href-${link.id}` : "href"}
            form={form}
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
            <BuscarNaPaginaButton
              href={href}
              onTitulo={setTitulo}
              onErro={setErro}
            />
          </InputGroupAddon>
        </InputGroup>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
      </div>
    </div>
  )
}
