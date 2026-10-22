"use client"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { LinkFields } from "@/components/painel/link-fields"
import { SubmitButton } from "@/components/painel/submit-button"
import { Button } from "@/components/ui/button"

type LinkFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  atividadeId: number
  submitLabel: string
  pendingLabel?: string
  onSuccess?: () => void
  onCancel?: () => void
}

/** Formulário para adicionar um link à atividade. */
export function LinkForm({
  action,
  atividadeId,
  submitLabel,
  pendingLabel = "Salvando...",
  onSuccess,
  onCancel,
}: LinkFormProps) {
  return (
    <ActionForm
      action={action}
      resetOnSuccess
      onSuccess={onSuccess}
      className="space-y-3"
    >
      <input type="hidden" name="atividade_id" value={atividadeId} />

      <LinkFields />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  )
}
