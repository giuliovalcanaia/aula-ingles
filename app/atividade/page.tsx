import { redirect } from "next/navigation"

import { StudentLinkList } from "@/components/student-link-list"
import type { ActivityStatus } from "@/components/clickable-card"
import { Card, CardDescription, CardHeader } from "@/components/ui/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/server"

const statuses: ActivityStatus[] = [
  "aberta",
  "fazendo",
  "concluida",
  "bloqueada",
]

function toStatus(value: string): ActivityStatus {
  return statuses.find((status) => status === value) ?? "bloqueada"
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>
}) {
  const { codigo } = await searchParams
  const codigoEntrada = codigo?.trim().toUpperCase()

  if (!codigoEntrada) redirect("/")

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) {
    redirect(`/aluno?codigo=${encodeURIComponent(codigoEntrada)}`)
  }

  const { data: estudante } = await supabase
    .from("estudantes")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!estudante) {
    redirect(`/aluno?codigo=${encodeURIComponent(codigoEntrada)}`)
  }

  const { data: aplicacao } = await supabase
    .from("aplicacoes")
    .select("id, atividade_id, status, data")
    .eq("codigo", codigoEntrada)
    .maybeSingle()

  if (!aplicacao) {
    redirect(`/aluno?codigo=${encodeURIComponent(codigoEntrada)}`)
  }

  const { data: participacao } = await supabase
    .from("participacoes")
    .select("id, nome, iniciado_em, concluido_em")
    .eq("aplicacao_id", aplicacao.id)
    .maybeSingle()

  if (!participacao) {
    redirect(`/aluno?codigo=${encodeURIComponent(codigoEntrada)}`)
  }

  const { data: atividade } = await supabase
    .from("atividades")
    .select("id, titulo, subtitulo, status")
    .eq("id", aplicacao.atividade_id)
    .maybeSingle()

  if (!atividade) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col p-4">
        <Card>
          <CardHeader>
            <p className="font-medium">
              Atividade não encontrada ou indisponível.
            </p>
            <CardDescription>
              Confira o código com o professor. A atividade pode ter sido
              fechada ou o código pode ser de outra atividade.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (atividade.status !== "publicada") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col p-4">
        <Card>
          <CardHeader>
            <p className="font-medium">Atividade indisponível.</p>
            <CardDescription>
              O professor fechou esta atividade. Fale com ele para mais
              informações.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (aplicacao.status === "encerrada") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col p-4">
        <Card>
          <CardHeader>
            <p className="font-medium">Atividade encerrada.</p>
            <CardDescription>
              O professor encerrou esta atividade. Fale com ele para mais
              informações.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const [{ data: links }, { data: progresso }] = await Promise.all([
    supabase
      .from("links")
      .select("id, titulo, descricao, href, ordem")
      .eq("atividade_id", atividade.id)
      .order("ordem", { ascending: true }),
    supabase
      .from("progresso_estudante")
      .select("link_id, status")
      .eq("participacao_id", participacao.id),
  ])

  const statusByLink = new Map(
    (progresso ?? []).map((row) => [row.link_id, toStatus(row.status)])
  )

  const items = (links ?? []).map((link) => ({
    id: link.id,
    titulo: link.titulo,
    descricao: link.descricao,
    href: link.href,
    status: statusByLink.get(link.id) ?? "bloqueada",
  }))

  const concluidas = items.filter((item) => item.status === "concluida").length
  const progressoPercentual =
    items.length > 0 ? Math.round((concluidas / items.length) * 100) : 0

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-4">
      <div className="m-4 mt-4">
        <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
          {atividade.titulo}
        </h1>
        {atividade.subtitulo && (
          <p className="text-muted-foreground sm:text-base">
            {atividade.subtitulo}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Aluno: {participacao.nome}
          {aplicacao.data && (
            <>
              {" · "}Data da aula:{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
              }).format(new Date(`${aplicacao.data}T12:00:00`))}
            </>
          )}
        </p>
        <Card className="mt-4">
          <CardHeader>
            <Progress value={progressoPercentual} className="w-full">
              <ProgressLabel>Progresso da Atividade</ProgressLabel>
              <ProgressValue />
            </Progress>
          </CardHeader>
        </Card>
      </div>

      <div className="m-4 mt-8">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Esta atividade ainda não tem links.
          </p>
        ) : (
          <StudentLinkList aplicacaoId={aplicacao.id} links={items} />
        )}
      </div>
    </div>
  )
}
