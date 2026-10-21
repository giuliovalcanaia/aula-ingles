"use client"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { AtividadeCampos } from "@/components/painel/atividade-campos"
import { SubmitButton } from "@/components/painel/submit-button"

export type AtividadeFormData = {
  id: number
  titulo: string
  subtitulo: string | null
  pasta_id: number | null
}

type ActivityFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  atividade: AtividadeFormData
}

/** Edição dos dados de uma atividade já criada. */
export function ActivityForm({ action, atividade }: ActivityFormProps) {
  return (
    <ActionForm action={action} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={atividade.id} />
      <input type="hidden" name="pasta_id" value={atividade.pasta_id ?? ""} />

      <AtividadeCampos
        titulo={atividade.titulo}
        subtitulo={atividade.subtitulo}
      />

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Salvando...">Salvar atividade</SubmitButton>
      </div>
    </ActionForm>
  )
}
