import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { createAtividade } from "@/app/painel/actions"
import { ActivityForm } from "@/components/painel/activity-form"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { flattenPastas } from "@/lib/pastas"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pasta?: string }>
}) {
  const { pasta } = await searchParams
  const pastaId = Number(pasta)
  const pastaSolicitada =
    Number.isInteger(pastaId) && pastaId > 0 ? pastaId : null

  const supabase = await createClient()

  const [{ data: turmas }, { data: pastas }] = await Promise.all([
    supabase.from("turmas").select("nome").order("nome"),
    supabase
      .from("pastas")
      .select("id, nome, parent_id")
      .is("deleted_at", null)
      .order("nome"),
  ])

  const pastaPadrao =
    pastaSolicitada !== null &&
    (pastas ?? []).some((item) => item.id === pastaSolicitada)
      ? pastaSolicitada
      : null

  const voltarHref =
    pastaPadrao === null ? "/painel" : `/painel/pastas/${pastaPadrao}`

  return (
    <div className="m-4 max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href={voltarHref}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Voltar
        </Link>
        <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
          Nova atividade
        </h1>
        <p className="text-sm text-muted-foreground">
          A atividade nasce como rascunho. Depois de adicionar os links, você
          publica para os alunos poderem entrar com o código de cada turma.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ActivityForm
            action={createAtividade}
            pastas={flattenPastas(pastas ?? [])}
            turmasExistentes={(turmas ?? []).map((turma) => turma.nome)}
            pastaPadrao={pastaPadrao}
          />
        </CardContent>
      </Card>
    </div>
  )
}
