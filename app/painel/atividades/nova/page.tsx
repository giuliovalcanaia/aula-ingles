import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { createAtividade } from "@/app/painel/actions"
import { NovaAtividadeForm } from "@/components/painel/nova-atividade-form"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

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

  const { data: pastas } = await supabase
    .from("pastas")
    .select("id, nome, parent_id")
    .is("deleted_at", null)
    .order("nome")

  const pastaDestino =
    pastaSolicitada === null
      ? null
      : ((pastas ?? []).find((item) => item.id === pastaSolicitada) ?? null)

  const voltarHref =
    pastaDestino === null ? "/painel" : `/painel/pastas/${pastaDestino.id}`

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={voltarHref}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "self-start",
          })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Voltar
        </Link>
        <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
          Nova atividade
        </h1>
        <p className="text-sm text-muted-foreground">
          A atividade nasce como rascunho. Preencha as informações, adicione os
          links e, quando estiver pronta, publique para os alunos entrarem com o
          código da atividade.
        </p>
      </div>

      <NovaAtividadeForm
        action={createAtividade}
        pastaId={pastaDestino?.id ?? null}
        pastaNome={pastaDestino?.nome ?? null}
        cancelHref={voltarHref}
      />
    </div>
  )
}
