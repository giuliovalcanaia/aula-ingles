"use client"

import { useState } from "react"
import Link from "next/link"
import { flushSync } from "react-dom"
import { PlusIcon, Trash2Icon } from "lucide-react"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { AtividadeCampos } from "@/components/painel/atividade-campos"
import { SubmitButton } from "@/components/painel/submit-button"
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
import { Textarea } from "@/components/ui/textarea"

type LinkNovo = {
  titulo: string
  href: string
  descricao: string
}

const LINK_VAZIO: LinkNovo = { titulo: "", href: "", descricao: "" }

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

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

  function addLink() {
    const titulo = link.titulo.trim()
    const hrefInformada = link.href.trim()
    if (!titulo || !hrefInformada) return

    const href = /^https?:\/\//i.test(hrefInformada)
      ? hrefInformada
      : `https://${hrefInformada}`

    if (!isHttpUrl(href)) {
      setErroHref("Informe uma URL que comece com http:// ou https://.")
      return
    }

    setLinks((atuais) => [
      ...atuais,
      { titulo, href, descricao: link.descricao.trim() },
    ])
    setLink(LINK_VAZIO)
    setErroHref(null)
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

              <Field>
                <FieldLabel htmlFor="senha">Senha de liberação</FieldLabel>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  minLength={4}
                  placeholder="Mínimo de 4 caracteres"
                  autoComplete="new-password"
                  required
                />
                <FieldDescription>
                  O aluno digita esta senha para concluir cada link.
                </FieldDescription>
              </Field>
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
                        {item.descricao && (
                          <span className="text-xs text-muted-foreground">
                            {item.descricao}
                          </span>
                        )}
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
                  <Field>
                    <FieldLabel htmlFor="link-titulo">
                      Título do link
                    </FieldLabel>
                    <Input
                      id="link-titulo"
                      value={link.titulo}
                      onChange={(event) =>
                        setLink({ ...link, titulo: event.target.value })
                      }
                      onKeyDown={adicionarLinkComEnter}
                      placeholder="Ex.: Exercise 1"
                      autoComplete="off"
                    />
                  </Field>

                  <Field data-invalid={Boolean(erroHref)}>
                    <FieldLabel htmlFor="link-href">URL</FieldLabel>
                    <Input
                      id="link-href"
                      value={link.href}
                      onChange={(event) => {
                        setLink({ ...link, href: event.target.value })
                        setErroHref(null)
                      }}
                      onKeyDown={adicionarLinkComEnter}
                      placeholder="https://..."
                      inputMode="url"
                      autoComplete="off"
                      aria-invalid={Boolean(erroHref)}
                    />
                    {erroHref ? (
                      <FieldError>{erroHref}</FieldError>
                    ) : (
                      <FieldDescription>
                        Endereço completo do exercício.
                      </FieldDescription>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="link-descricao">
                      Descrição (opcional)
                    </FieldLabel>
                    <Textarea
                      id="link-descricao"
                      value={link.descricao}
                      onChange={(event) =>
                        setLink({ ...link, descricao: event.target.value })
                      }
                      placeholder="O que o aluno deve fazer neste link"
                      rows={2}
                    />
                  </Field>
                </FieldGroup>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLink}
                    disabled={!link.titulo.trim() || !link.href.trim()}
                  >
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
