"use client"

import { useState } from "react"
import Link from "next/link"
import { flushSync } from "react-dom"
import { PlusIcon, Trash2Icon } from "lucide-react"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { AtividadeCampos } from "@/components/painel/atividade-campos"
import { DatePicker } from "@/components/painel/date-picker"
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
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type TurmaAplicacao = {
  turma: string
  data: string
}

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
  turmasExistentes: string[]
  pastaId: number | null
  pastaNome: string | null
  cancelHref: string
}

export function NovaAtividadeForm({
  action,
  turmasExistentes,
  pastaId,
  pastaNome,
  cancelHref,
}: NovaAtividadeFormProps) {
  const [aba, setAba] = useState("informacoes")
  const [aplicacoes, setAplicacoes] = useState<TurmaAplicacao[]>([])
  const [turma, setTurma] = useState("")
  const [data, setData] = useState("")
  const [links, setLinks] = useState<LinkNovo[]>([])
  const [link, setLink] = useState<LinkNovo>(LINK_VAZIO)
  const [erroHref, setErroHref] = useState<string | null>(null)

  function addTurma() {
    const nome = turma.trim()
    if (!nome) return

    setAplicacoes((atuais) => {
      if (
        atuais.some((item) => item.turma.toLowerCase() === nome.toLowerCase())
      ) {
        return atuais
      }
      return [...atuais, { turma: nome, data }]
    })
    setTurma("")
    setData("")
  }

  function removeTurma(index: number) {
    setAplicacoes((atuais) => atuais.filter((_, i) => i !== index))
  }

  function updateData(index: number, value: string) {
    setAplicacoes((atuais) =>
      atuais.map((item, i) => (i === index ? { ...item, data: value } : item))
    )
  }

  // Enter nos campos de turma não deve enviar o formulário: ele adiciona a
  // turma à lista.
  function adicionarTurmaComEnter(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key !== "Enter") return
    event.preventDefault()
    addTurma()
  }

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
      <input
        type="hidden"
        name="aplicacoes"
        value={JSON.stringify(
          aplicacoes.map((item) => ({
            turma: item.turma,
            data: item.data || null,
          }))
        )}
      />
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
                Defina o título e a senha, e indique as turmas que vão realizar
                a atividade.{" "}
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
                  O aluno digita esta senha para concluir cada link. Ela vale
                  para todas as turmas desta atividade.
                </FieldDescription>
              </Field>

              <FieldSet>
                <FieldLegend>Turmas</FieldLegend>
                <FieldDescription>
                  Cada turma recebe um código de entrada e uma lista de nomes
                  própria. Escolha uma turma existente ou digite uma nova.
                </FieldDescription>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Field className="flex-1">
                    <FieldLabel htmlFor="turma-nova">Turma</FieldLabel>
                    <Input
                      id="turma-nova"
                      list="turmas-existentes"
                      value={turma}
                      onChange={(event) => setTurma(event.target.value)}
                      onKeyDown={adicionarTurmaComEnter}
                      placeholder="Ex.: 1º ano A"
                      autoComplete="off"
                    />
                    <datalist id="turmas-existentes">
                      {turmasExistentes.map((nome) => (
                        <option key={nome} value={nome} />
                      ))}
                    </datalist>
                  </Field>
                  <Field className="sm:w-40">
                    <FieldLabel htmlFor="turma-data">Data</FieldLabel>
                    <DatePicker
                      id="turma-data"
                      value={data}
                      onChange={setData}
                      placeholder="Data"
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTurma}
                    disabled={!turma.trim()}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Adicionar
                  </Button>
                </div>

                {aplicacoes.length > 0 ? (
                  <FieldGroup className="gap-2">
                    {aplicacoes.map((item, index) => (
                      <Field
                        key={`${item.turma}-${index}`}
                        orientation="horizontal"
                        className="rounded-lg border p-2"
                      >
                        <FieldTitle className="flex-1">{item.turma}</FieldTitle>
                        <DatePicker
                          value={item.data}
                          onChange={(value) => updateData(index, value)}
                          aria-label={`Data da turma ${item.turma}`}
                          placeholder="Data"
                          className="w-40"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remover ${item.turma}`}
                          onClick={() => removeTurma(index)}
                        >
                          <Trash2Icon />
                        </Button>
                      </Field>
                    ))}
                  </FieldGroup>
                ) : (
                  <FieldDescription>
                    Nenhuma turma adicionada ainda. A atividade precisa de pelo
                    menos uma para ser publicada.
                  </FieldDescription>
                )}
              </FieldSet>
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
