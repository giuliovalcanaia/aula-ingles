import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

type AtividadeCabecalhoProps = {
  voltarHref: string
  titulo: string
  subtitulo?: string | null
  badge?: {
    label: string
    variant?: "default" | "secondary"
  }
  meta: ReactNode
  acoes?: ReactNode
}

/** Cabeçalho compartilhado pela criação e pela edição de atividades. */
export function AtividadeCabecalho({
  voltarHref,
  titulo,
  subtitulo,
  badge,
  meta,
  acoes,
}: AtividadeCabecalhoProps) {
  return (
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
              {titulo}
            </h1>
            {badge && (
              <Badge variant={badge.variant ?? "secondary"}>
                {badge.label}
              </Badge>
            )}
          </div>
          {subtitulo && (
            <p className="text-sm text-muted-foreground">{subtitulo}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {meta}
          </div>
        </div>

        {acoes && (
          <div className="flex flex-wrap items-center gap-2">{acoes}</div>
        )}
      </div>
    </div>
  )
}
