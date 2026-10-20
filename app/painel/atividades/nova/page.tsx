import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { createAtividade } from "@/app/painel/actions"
import { ActivityForm } from "@/components/painel/activity-form"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { flattenPastas } from "@/lib/pastas"

export default async function Page() {
  const supabase = await createClient()

  const [{ data: turmas }, { data: pastas }] = await Promise.all([
    supabase.from("turmas").select("nome").order("nome"),
    supabase.from("pastas").select("id, nome, parent_id").order("nome"),
  ])

  return (
    <div className="m-4 max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/painel"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeftIcon />
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
          />
        </CardContent>
      </Card>
    </div>
  )
}
