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
  const codigoAtividade = codigo?.trim().toUpperCase()

  if (!codigoAtividade) redirect("/")

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) {
    redirect(`/aluno?codigo=${encodeURIComponent(codigoAtividade)}`)
  }

  const { data: estudante } = await supabase
    .from("estudantes")
    .select("id, nome")
    .eq("user_id", userId)
    .maybeSingle()

  // Sem registro de aluno (sessão nova ou professor): volta para a entrada.
  if (!estudante) {
    redirect(`/aluno?codigo=${encodeURIComponent(codigoAtividade)}`)
  }

  const { data: atividade } = await supabase
    .from("atividades")
    .select("id, titulo, subtitulo, status, data_realizacao")
    .eq("codigo_atividade", codigoAtividade)
    .maybeSingle()

  if (!atividade) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col p-4">
        <Card>
          <CardHeader>
            <p className="font-medium">Atividade não encontrada.</p>
            <CardDescription>
              Confira o código com o professor e{" "}
              <a href="/" className="underline underline-offset-4">
                tente novamente
              </a>
              .
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

  const [{ data: links }, { data: progresso }] = await Promise.all([
    supabase
      .from("links")
      .select("id, titulo, descricao, href, ordem")
      .eq("atividade_id", atividade.id)
      .order("ordem", { ascending: true }),
    supabase
      .from("progresso_estudante")
      .select("link_id, status")
      .eq("estudante_id", estudante.id),
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
        {atividade.data_realizacao && (
          <p className="text-sm text-muted-foreground">
            Data da aula:{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
              new Date(`${atividade.data_realizacao}T12:00:00`)
            )}
          </p>
        )}
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
          <StudentLinkList links={items} />
        )}
      </div>
    </div>
  )
}
