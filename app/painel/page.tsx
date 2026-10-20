import Link from "next/link"
import { ArrowRightIcon, PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  arquivada: "Arquivada",
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T12:00:00`)) : null
}

export default async function Page() {
  const supabase = await createClient()

  const [
    { data: atividades },
    { data: turmas },
    { data: pastas },
    { data: links },
  ] = await Promise.all([
    supabase
      .from("atividades")
      .select(
        "id, titulo, subtitulo, codigo_atividade, turma_id, pasta_id, data_realizacao, status"
      )
      .order("created_at", { ascending: false }),
    supabase.from("turmas").select("id, nome"),
    supabase.from("pastas").select("id, nome"),
    supabase.from("links").select("id, atividade_id"),
  ])

  const nomesTurmas = new Map(
    (turmas ?? []).map((turma) => [turma.id, turma.nome])
  )
  const nomesPastas = new Map(
    (pastas ?? []).map((pasta) => [pasta.id, pasta.nome])
  )

  const linksPorAtividade = new Map<number, number>()
  for (const link of links ?? []) {
    linksPorAtividade.set(
      link.atividade_id,
      (linksPorAtividade.get(link.atividade_id) ?? 0) + 1
    )
  }

  return (
    <div className="m-4 max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
            Atividades
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie uma atividade, adicione os links e publique para os alunos.
          </p>
        </div>
        <Link
          href="/painel/atividades/nova"
          className={buttonVariants({ variant: "default" })}
        >
          <PlusIcon />
          Nova atividade
        </Link>
      </div>

      {!atividades || atividades.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Você ainda não criou nenhuma atividade</CardTitle>
            <CardDescription>
              Comece criando uma turma e depois uma atividade com os links da
              aula.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link
              href="/painel/atividades/nova"
              className={buttonVariants({ variant: "default" })}
            >
              Criar atividade
            </Link>
            <Link
              href="/painel/turmas"
              className={buttonVariants({ variant: "outline" })}
            >
              Criar turma
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {atividades.map((atividade) => (
            <Card key={atividade.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle>{atividade.titulo}</CardTitle>
                  <Badge
                    variant={
                      atividade.status === "publicada" ? "default" : "secondary"
                    }
                  >
                    {statusLabels[atividade.status] ?? atividade.status}
                  </Badge>
                </div>
                {atividade.subtitulo && (
                  <CardDescription>{atividade.subtitulo}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    Turma: {nomesTurmas.get(atividade.turma_id) ?? "—"}
                  </span>
                  <span>
                    Pasta:{" "}
                    {atividade.pasta_id
                      ? (nomesPastas.get(atividade.pasta_id) ?? "—")
                      : "Sem pasta"}
                  </span>
                  <span>
                    {linksPorAtividade.get(atividade.id) ?? 0} link(s)
                  </span>
                  {atividade.data_realizacao && (
                    <span>Data: {formatDate(atividade.data_realizacao)}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-medium">
                    {atividade.codigo_atividade}
                  </span>
                  <Link
                    href={`/painel/atividades/${atividade.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Abrir
                    <ArrowRightIcon />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
