import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ExternalLinkIcon,
} from "lucide-react"

import {
  createLink,
  deleteLink,
  moveLink,
  publishAtividade,
  setAplicacaoStatus,
  unpublishAtividade,
  updateActivityPassword,
  updateAtividade,
  updateLink,
  updateStudentProgress,
} from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { ActivityForm } from "@/components/painel/activity-form"
import { ConfirmAction } from "@/components/painel/confirm-action"
import { SubmitButton } from "@/components/painel/submit-button"
import { TrashActivityButton } from "@/components/painel/trash-activity-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  arquivada: "Arquivada",
}

const progressoLabels: Record<string, string> = {
  aberta: "Aberta",
  fazendo: "Em andamento",
  concluida: "Concluída",
  bloqueada: "Bloqueada",
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
})

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "—"
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T12:00:00`)) : "—"
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const atividadeId = Number(id)

  if (!Number.isInteger(atividadeId) || atividadeId <= 0) notFound()

  const supabase = await createClient()

  const { data: atividade } = await supabase
    .from("atividades")
    .select("id, titulo, subtitulo, pasta_id, status")
    .eq("id", atividadeId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!atividade) notFound()

  const [
    { data: pastas },
    { data: senha },
    { data: links },
    { data: aplicacoes },
  ] = await Promise.all([
    supabase
      .from("pastas")
      .select("id, nome, parent_id")
      .is("deleted_at", null)
      .order("nome"),
    supabase
      .from("atividade_senhas")
      .select("atividade_id")
      .eq("atividade_id", atividadeId)
      .maybeSingle(),
    supabase
      .from("links")
      .select("id, titulo, descricao, href, ordem")
      .eq("atividade_id", atividadeId)
      .order("ordem"),
    supabase
      .from("aplicacoes")
      .select("id, codigo, data, status")
      .eq("atividade_id", atividadeId)
      .order("created_at"),
  ])

  const aplicacaoIds = (aplicacoes ?? []).map((aplicacao) => aplicacao.id)
  const linkIds = (links ?? []).map((link) => link.id)

  const { data: participacoes } = await supabase
    .from("participacoes")
    .select("id, aplicacao_id, nome, iniciado_em, concluido_em")
    .in("aplicacao_id", aplicacaoIds.length > 0 ? aplicacaoIds : [-1])
    .order("nome")

  const participacaoIds = (participacoes ?? []).map(
    (participacao) => participacao.id
  )

  const { data: progresso } = await supabase
    .from("progresso_estudante")
    .select("participacao_id, link_id, status, pontuacao")
    .in("participacao_id", participacaoIds.length > 0 ? participacaoIds : [-1])
    .in("link_id", linkIds.length > 0 ? linkIds : [-1])

  const progressoPorParticipacaoLink = new Map(
    (progresso ?? []).map((row) => [
      `${row.participacao_id}:${row.link_id}`,
      row,
    ])
  )

  const participacoesPorAplicacao = new Map<
    number,
    NonNullable<typeof participacoes>
  >()
  for (const participacao of participacoes ?? []) {
    const lista = participacoesPorAplicacao.get(participacao.aplicacao_id) ?? []
    lista.push(participacao)
    participacoesPorAplicacao.set(participacao.aplicacao_id, lista)
  }

  const pasta = (pastas ?? []).find((item) => item.id === atividade.pasta_id)
  const publicada = atividade.status === "publicada"
  const totalAlunos = participacoes?.length ?? 0
  const voltarHref = pasta ? `/painel/pastas/${pasta.id}` : "/painel"

  return (
    <div className="m-4 max-w-5xl space-y-6">
      <div className="space-y-2">
        <Link
          href={voltarHref}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Voltar
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
                {atividade.titulo}
              </h1>
              <Badge variant={publicada ? "default" : "secondary"}>
                {statusLabels[atividade.status] ?? atividade.status}
              </Badge>
            </div>
            {atividade.subtitulo && (
              <p className="text-sm text-muted-foreground">
                {atividade.subtitulo}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Pasta: {pasta?.nome ?? "Sem pasta"}</span>
              <span>Alunos: {totalAlunos}</span>
              <span>Links: {(links ?? []).length}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {publicada ? (
              <ActionForm action={unpublishAtividade}>
                <input type="hidden" name="id" value={atividade.id} />
                <SubmitButton variant="outline" pendingLabel="Salvando...">
                  Voltar para rascunho
                </SubmitButton>
              </ActionForm>
            ) : (
              <ActionForm action={publishAtividade}>
                <input type="hidden" name="id" value={atividade.id} />
                <SubmitButton pendingLabel="Publicando...">
                  Publicar
                </SubmitButton>
              </ActionForm>
            )}
            <TrashActivityButton
              id={atividade.id}
              nome={atividade.titulo}
              redirectTo={voltarHref}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="alunos" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="alunos">Alunos ({totalAlunos})</TabsTrigger>
          <TabsTrigger value="links">
            Links ({(links ?? []).length})
          </TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="alunos" className="space-y-3">
          {!aplicacoes || aplicacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta atividade não tem um código de entrada.
            </p>
          ) : (
            aplicacoes.map((aplicacao, index) => {
              const alunos = participacoesPorAplicacao.get(aplicacao.id) ?? []
              const aberta = aplicacao.status === "aberta"

              return (
                <Card key={aplicacao.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle>
                            {aplicacoes.length > 1
                              ? `Entrada ${index + 1}`
                              : "Código de entrada"}
                          </CardTitle>
                          <Badge variant={aberta ? "default" : "secondary"}>
                            {aberta ? "Aberta" : "Encerrada"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Criada em {formatDate(aplicacao.data)} ·{" "}
                          {alunos.length} aluno(s)
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm font-semibold">
                          {aplicacao.codigo}
                        </span>
                        <ActionForm action={setAplicacaoStatus}>
                          <input type="hidden" name="id" value={aplicacao.id} />
                          <input
                            type="hidden"
                            name="atividade_id"
                            value={atividade.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value={aberta ? "encerrada" : "aberta"}
                          />
                          <SubmitButton
                            variant="outline"
                            size="sm"
                            pendingLabel="Salvando..."
                          >
                            {aberta ? "Encerrar" : "Reabrir"}
                          </SubmitButton>
                        </ActionForm>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {alunos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum aluno entrou ainda. Compartilhe o código{" "}
                        {aplicacao.codigo}.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {alunos.map((aluno) => {
                          const concluidos = (links ?? []).filter(
                            (link) =>
                              progressoPorParticipacaoLink.get(
                                `${aluno.id}:${link.id}`
                              )?.status === "concluida"
                          ).length

                          return (
                            <div
                              key={aluno.id}
                              className="rounded-lg border p-3"
                            >
                              <details>
                                <summary className="cursor-pointer text-sm">
                                  <span className="font-medium">
                                    {aluno.nome}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · {concluidos}/{(links ?? []).length}{" "}
                                    concluídos · início{" "}
                                    {formatDateTime(aluno.iniciado_em)} · fim{" "}
                                    {formatDateTime(aluno.concluido_em)}
                                  </span>
                                </summary>
                                <div className="mt-3 space-y-2">
                                  {(links ?? []).map((link, index) => {
                                    const row =
                                      progressoPorParticipacaoLink.get(
                                        `${aluno.id}:${link.id}`
                                      )

                                    return (
                                      <ActionForm
                                        key={link.id}
                                        action={updateStudentProgress}
                                        className="flex flex-wrap items-end gap-2 rounded-lg border p-2"
                                      >
                                        <input
                                          type="hidden"
                                          name="atividade_id"
                                          value={atividade.id}
                                        />
                                        <input
                                          type="hidden"
                                          name="participacao_id"
                                          value={aluno.id}
                                        />
                                        <input
                                          type="hidden"
                                          name="link_id"
                                          value={link.id}
                                        />
                                        <div className="min-w-40 flex-1 text-sm">
                                          <span className="text-muted-foreground">
                                            {index + 1}.
                                          </span>{" "}
                                          {link.titulo}
                                          <span className="block text-xs text-muted-foreground">
                                            {
                                              progressoLabels[
                                                row?.status ?? "bloqueada"
                                              ]
                                            }
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          <Label
                                            htmlFor={`status-${aluno.id}-${link.id}`}
                                            className="text-xs"
                                          >
                                            Situação
                                          </Label>
                                          <NativeSelect
                                            id={`status-${aluno.id}-${link.id}`}
                                            name="status"
                                            defaultValue={
                                              row?.status ?? "bloqueada"
                                            }
                                            size="sm"
                                            className="w-full"
                                          >
                                            <NativeSelectOption value="bloqueada">
                                              Bloqueada
                                            </NativeSelectOption>
                                            <NativeSelectOption value="aberta">
                                              Aberta
                                            </NativeSelectOption>
                                            <NativeSelectOption value="fazendo">
                                              Em andamento
                                            </NativeSelectOption>
                                            <NativeSelectOption value="concluida">
                                              Concluída
                                            </NativeSelectOption>
                                          </NativeSelect>
                                        </div>
                                        <div className="space-y-1">
                                          <Label
                                            htmlFor={`nota-${aluno.id}-${link.id}`}
                                            className="text-xs"
                                          >
                                            Nota
                                          </Label>
                                          <Input
                                            id={`nota-${aluno.id}-${link.id}`}
                                            name="pontuacao"
                                            type="number"
                                            min={0}
                                            className="w-20"
                                            defaultValue={row?.pontuacao ?? ""}
                                            placeholder="—"
                                          />
                                        </div>
                                        <SubmitButton
                                          variant="outline"
                                          size="sm"
                                        >
                                          Salvar
                                        </SubmitButton>
                                      </ActionForm>
                                    )
                                  })}
                                </div>
                              </details>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="links" className="space-y-3">
          {!links || links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum link adicionado ainda. Adicione pelo menos um para poder
              publicar a atividade.
            </p>
          ) : (
            links.map((link, index) => (
              <Card key={link.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
                      >
                        {link.href}
                        <ExternalLinkIcon className="size-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <ActionForm action={moveLink}>
                        <input type="hidden" name="id" value={link.id} />
                        <input
                          type="hidden"
                          name="atividade_id"
                          value={atividade.id}
                        />
                        <div className="flex gap-1">
                          <SubmitButton
                            variant="ghost"
                            size="icon-sm"
                            name="direcao"
                            value="-1"
                            aria-label="Mover para cima"
                            pendingLabel="..."
                          >
                            <ArrowUpIcon />
                          </SubmitButton>
                          <SubmitButton
                            variant="ghost"
                            size="icon-sm"
                            name="direcao"
                            value="1"
                            aria-label="Mover para baixo"
                            pendingLabel="..."
                          >
                            <ArrowDownIcon />
                          </SubmitButton>
                        </div>
                      </ActionForm>
                      <ConfirmAction
                        action={deleteLink}
                        fields={{ id: link.id, atividade_id: atividade.id }}
                        title="Excluir este link?"
                        description="O progresso dos alunos nesse link também será excluído."
                      />
                    </div>
                  </div>

                  <ActionForm
                    action={updateLink}
                    className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                  >
                    <input type="hidden" name="id" value={link.id} />
                    <input
                      type="hidden"
                      name="atividade_id"
                      value={atividade.id}
                    />
                    <div className="space-y-2">
                      <Label htmlFor={`titulo-${link.id}`}>Título</Label>
                      <Input
                        id={`titulo-${link.id}`}
                        name="titulo"
                        defaultValue={link.titulo}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`href-${link.id}`}>URL</Label>
                      <Input
                        id={`href-${link.id}`}
                        name="href"
                        type="url"
                        defaultValue={link.href}
                        required
                      />
                    </div>
                    <SubmitButton variant="outline">Salvar</SubmitButton>
                    <div className="space-y-2 sm:col-span-3">
                      <Label htmlFor={`descricao-${link.id}`}>
                        Descrição (opcional)
                      </Label>
                      <Textarea
                        id={`descricao-${link.id}`}
                        name="descricao"
                        rows={2}
                        defaultValue={link.descricao ?? ""}
                      />
                    </div>
                  </ActionForm>
                </CardContent>
              </Card>
            ))
          )}

          <Card>
            <CardHeader>
              <CardTitle>Adicionar link</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createLink} className="space-y-3">
                <input type="hidden" name="atividade_id" value={atividade.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="novo-titulo">Título</Label>
                    <Input
                      id="novo-titulo"
                      name="titulo"
                      placeholder="Ex.: Exercise 1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-href">URL</Label>
                    <Input
                      id="novo-href"
                      name="href"
                      type="url"
                      placeholder="https://..."
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nova-descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="nova-descricao"
                    name="descricao"
                    rows={2}
                    placeholder="O que o aluno deve fazer neste link"
                  />
                </div>
                <SubmitButton pendingLabel="Adicionando...">
                  Adicionar link
                </SubmitButton>
              </ActionForm>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityForm action={updateAtividade} atividade={atividade} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Senha de liberação</CardTitle>
              <CardDescription>
                {senha
                  ? "A senha está definida. Ela vale para todos os alunos desta atividade."
                  : "Nenhuma senha definida. O aluno não consegue concluir os links sem ela."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActionForm
                action={updateActivityPassword}
                resetOnSuccess
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="atividade_id" value={atividade.id} />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="nova-senha">Nova senha</Label>
                  <Input
                    id="nova-senha"
                    name="senha"
                    type="password"
                    autoComplete="new-password"
                    minLength={4}
                    placeholder="Mínimo de 4 caracteres"
                    required
                  />
                </div>
                <SubmitButton pendingLabel="Salvando...">
                  {senha ? "Trocar senha" : "Definir senha"}
                </SubmitButton>
              </ActionForm>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
