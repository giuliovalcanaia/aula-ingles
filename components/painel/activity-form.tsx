"use client"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { SubmitButton } from "@/components/painel/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

export type TurmaOption = {
  id: number
  nome: string
}

export type PastaOption = {
  id: number
  nome: string
  depth: number
}

export type AtividadeFormData = {
  id: number
  titulo: string
  subtitulo: string | null
  turma_id: number
  pasta_id: number | null
  data_realizacao: string | null
  codigo_atividade: string
}

type ActivityFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  turmas: TurmaOption[]
  pastas: PastaOption[]
  atividade?: AtividadeFormData
}

export function ActivityForm({
  action,
  turmas,
  pastas,
  atividade,
}: ActivityFormProps) {
  const editando = Boolean(atividade)

  return (
    <ActionForm action={action} className="grid gap-4 sm:grid-cols-2">
      {atividade && <input type="hidden" name="id" value={atividade.id} />}

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          name="titulo"
          placeholder="Ex.: Can / Can't"
          defaultValue={atividade?.titulo}
          required
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="subtitulo">Subtítulo (opcional)</Label>
        <Textarea
          id="subtitulo"
          name="subtitulo"
          placeholder="Ex.: Exercícios de can / can't"
          defaultValue={atividade?.subtitulo ?? ""}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="turma_id">Turma</Label>
        <NativeSelect
          id="turma_id"
          name="turma_id"
          defaultValue={atividade?.turma_id.toString() ?? ""}
          className="w-full"
          required
        >
          <NativeSelectOption value="" disabled>
            Selecione
          </NativeSelectOption>
          {turmas.map((turma) => (
            <NativeSelectOption key={turma.id} value={turma.id}>
              {turma.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pasta_id">Pasta (opcional)</Label>
        <NativeSelect
          id="pasta_id"
          name="pasta_id"
          defaultValue={atividade?.pasta_id?.toString() ?? ""}
          className="w-full"
        >
          <NativeSelectOption value="">Sem pasta</NativeSelectOption>
          {pastas.map((pasta) => (
            <NativeSelectOption key={pasta.id} value={pasta.id}>
              {"— ".repeat(pasta.depth)}
              {pasta.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="data_realizacao">Data da aula (opcional)</Label>
        <Input
          id="data_realizacao"
          name="data_realizacao"
          type="date"
          defaultValue={atividade?.data_realizacao ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="codigo_atividade">Código da atividade</Label>
        <Input
          id="codigo_atividade"
          name="codigo_atividade"
          placeholder="Gerado automaticamente"
          defaultValue={atividade?.codigo_atividade ?? ""}
          autoCapitalize="characters"
          spellCheck={false}
          className="uppercase placeholder:normal-case"
        />
        <p className="text-xs text-muted-foreground">
          Deixe em branco para gerar um código. O aluno usa esse código para
          entrar.
        </p>
      </div>

      {!editando && (
        <div className="space-y-2">
          <Label htmlFor="senha">Senha para liberar a próxima atividade</Label>
          <Input
            id="senha"
            name="senha"
            type="password"
            placeholder="Mínimo de 4 caracteres"
            autoComplete="new-password"
            minLength={4}
            required
          />
          <p className="text-xs text-muted-foreground">
            Você entrega essa senha ao aluno depois que ele terminar cada link.
          </p>
        </div>
      )}

      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Salvando...">
          {editando ? "Salvar atividade" : "Criar atividade"}
        </SubmitButton>
      </div>
    </ActionForm>
  )
}
