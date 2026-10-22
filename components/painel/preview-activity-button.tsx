"use client"

import { EyeIcon } from "lucide-react"

import { useLinksDraft } from "@/components/painel/links-draft"
import { Button } from "@/components/ui/button"

/** Abre a visão do aluno em outra aba, sem gravar progresso. */
export function PreviewActivityButton({
  atividadeId,
}: {
  atividadeId: number
}) {
  const { dirty } = useLinksDraft()

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <a
            href={`/previa/${atividadeId}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
      >
        <EyeIcon data-icon="inline-start" />
        Pré-visualizar
      </Button>
      {dirty && (
        <span className="text-right text-xs text-muted-foreground">
          Prévia da versão salva.
        </span>
      )}
    </div>
  )
}
