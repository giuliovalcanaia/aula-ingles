"use client"

import { useState } from "react"
import Link from "next/link"
import { flushSync } from "react-dom"
import { PlusIcon, Trash2Icon } from "lucide-react"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { AtividadeCampos } from "@/components/painel/atividade-campos"
import { BuscarNaPaginaButton } from "@/components/painel/buscar-na-pagina-button"
import { SenhaField } from "@/components/painel/senha-field"
import { SubmitButton } from "@/components/painel/submit-button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { normalizeHttpUrl } from "@/lib/links"

type LinkNovo = {
  titulo: string
  href: string
}

const LINK_VAZIO: LinkNovo = { titulo: "", href: "" }

type NovaAtividadeFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  pastaId: number | null
  pastaNome: string | null
  cancelHref: string
}

export function NovaAtividadeForm({
  action,
  pastaId,
  pastaNome,
  cancelHref,
}: NovaAtividadeFormProps) {
  const [aba, setAba] = useState("informacoes")
  const [links, setLinks] = useState<LinkNovo[]>([])
  const [link, setLink] = useState<LinkNovo>(LINK_VAZIO)
  const [erroHref, setErroHref] = useState<string | null>(null)
  const [erroTitulo, setErroTitulo] = useState<string | null>(null)

  function addLink() {
    const titulo = link.titulo.trim()
    const href = normalizeHttpUrl(link.href)
    if (!titulo) {
      setErroTitulo("Informe o título do link.")
      return
    }

    if (!href) {
      setErroHref(
        "Informe um endereço válido, como google.com ou https://google.com."
      )
      return
    }

    setLinks((atuais) => [...atuais, { titulo, href }])
    setLink(LINK_VAZIO)
    setErroHref(null)
    setErroTitulo(null)
  }

  function removeLink(index: number) {
    setLinks((atuais) => atuais.filter((_, i) => i !== index))
  }

  function adicionarLinkComEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    addLink()
  }

  // Os campos da aba de informações ficam ocultos quando outra aba está ativa,
  // e um campo oculto não pode receber foco: a validação nativa não conseguiria
  // apontar o que falta. Voltamos para a aba antes de deixar o envio acontecer.
  function mostrarInformacoesAntesDeEnviar() {
    if (aba !== "informacoes") flushSync(() => setAba("informacoes"))
  }

  return (
    <ActionForm action={action} className="flex flex-col gap-6">
      <input type="hidden" name="pasta_id" value={pastaId ?? ""} />
      <input type="hidden" name="links" value={JSON.stringify(links)} />

      <Tabs
        value={aba}
        onValueChange={(value) => setAba(String(value))}
        className="gap-4"
      >
        <TabsList variant="line">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="links">
            Links{links.length > 0 ? ` (${links.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes" keepMounted>
          <Card>
            <CardHeader>
              <CardTitle>Informações da atividade</CardTitle>
              <CardDescription>
                Defina o título e a senha da atividade.{" "}
                {pastaNome
                  ? `Ela será criada na pasta “${pastaNome}”.`
                  : "Ela será criada na raiz do painel."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <AtividadeCampos autoFocus />

              <SenhaField />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" keepMounted>
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>
                Adicione os links na ordem em que os alunos devem fazer. Você
                pode criar a atividade vazia e completar os links depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {links.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {links.map((item, index) => (
                    <li
                      key={`${item.href}-${index}`}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <Badge variant="outline">{index + 1}</Badge>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">
                          {item.titulo}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.href}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover ${item.titulo}`}
                        onClick={() => removeLink(index)}
                      >
                        <Trash2Icon />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <FieldDescription>
                  Nenhum link adicionado ainda. A atividade pode ser criada
                  assim e publicada quando os links estiverem prontos.
                </FieldDescription>
              )}

              <Separator />

              <FieldSet>
                <FieldLegend variant="label">Adicionar link</FieldLegend>
                <FieldGroup>
                  <Field data-invalid={Boolean(erroTitulo)}>
                    <FieldLabel htmlFor="link-titulo">
                      Título do link
                    </FieldLabel>
                    <Input
                      id="link-titulo"
                      value={link.titulo}
                      onChange={(event) => {
                        setLink({ ...link, titulo: event.target.value })
                        setErroTitulo(null)
                      }}
                      onKeyDown={adicionarLinkComEnter}
                      placeholder="Ex.: Exercise 1"
                      autoComplete="off"
                      aria-invalid={Boolean(erroTitulo)}
                    />
                    {erroTitulo && <FieldError>{erroTitulo}</FieldError>}
                  </Field>

                  <Field data-invalid={Boolean(erroHref)}>
                    <FieldLabel htmlFor="link-href">URL</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="link-href"
                        value={link.href}
                        onChange={(event) => {
                          setLink({ ...link, href: event.target.value })
                          setErroHref(null)
                        }}
                        onKeyDown={adicionarLinkComEnter}
                        placeholder="google.com ou https://..."
                        inputMode="url"
                        autoComplete="off"
                        aria-invalid={Boolean(erroHref)}
                      />
                      <InputGroupAddon align="inline-end">
                        <BuscarNaPaginaButton
                          href={link.href}
                          onTitulo={(titulo) => {
                            setLink((atual) => ({ ...atual, titulo }))
                            setErroTitulo(null)
                          }}
                          onErro={setErroHref}
                        />
                      </InputGroupAddon>
                    </InputGroup>
                    {erroHref ? (
                      <FieldError>{erroHref}</FieldError>
                    ) : (
                      <FieldDescription>
                        Pode digitar sem https:// ou usar “Buscar na página”.
                      </FieldDescription>
                    )}
                  </Field>
                </FieldGroup>

                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={addLink}>
                    <PlusIcon data-icon="inline-start" />
                    Adicionar link
                  </Button>
                </div>
              </FieldSet>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancelar
        </Link>
        <SubmitButton
          onClick={mostrarInformacoesAntesDeEnviar}
          pendingLabel="Criando..."
        >
          Criar atividade
        </SubmitButton>
      </div>
    </ActionForm>
  )
}
