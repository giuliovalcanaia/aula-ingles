"use client"

import { useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { SubmitButton } from "@/components/painel/submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

export type PastaOption = {
  id: number
  nome: string
  depth: number
}

export type AtividadeFormData = {
  id: number
  titulo: string
  subtitulo: string | null
  pasta_id: number | null
}

type TurmaAplicacao = {
  turma: string
  data: string
}

type ActivityFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  pastas: PastaOption[]
  turmasExistentes?: string[]
  atividade?: AtividadeFormData
  pastaPadrao?: number | null
}

export function ActivityForm({
  action,
  pastas,
  turmasExistentes = [],
  atividade,
  pastaPadrao = null,
}: ActivityFormProps) {
  const editando = Boolean(atividade)
  const [aplicacoes, setAplicacoes] = useState<TurmaAplicacao[]>([])
  const [turma, setTurma] = useState("")
  const [data, setData] = useState("")
  const pastaSelecionada = atividade?.pasta_id ?? pastaPadrao ?? null

  function addTurma() {
    const nome = turma.trim()
    if (!nome) return

    setAplicacoes((atuais) => {
      if (
        atuais.some((item) => item.turma.toLowerCase() === nome.toLowerCase())
      ) {
        return atuais
      }
      return [...atuais, { turma: nome, data }]
    })
    setTurma("")
    setData("")
  }

  function removeTurma(index: number) {
    setAplicacoes((atuais) => atuais.filter((_, i) => i !== index))
  }

  function updateData(index: number, value: string) {
    setAplicacoes((atuais) =>
      atuais.map((item, i) => (i === index ? { ...item, data: value } : item))
    )
  }

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
        <Label htmlFor="pasta_id">Pasta (opcional)</Label>
        <NativeSelect
          id="pasta_id"
          name="pasta_id"
          defaultValue={pastaSelecionada?.toString() ?? ""}
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
        </div>
      )}

      {!editando && (
        <div className="space-y-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium">
              Turmas que vão realizar a atividade
            </p>
            <p className="text-xs text-muted-foreground">
              Escolha uma turma existente ou digite uma nova. Cada turma recebe
              um código de entrada próprio.
            </p>
          </div>

          <input
            type="hidden"
            name="aplicacoes"
            value={JSON.stringify(
              aplicacoes.map((item) => ({
                turma: item.turma,
                data: item.data || null,
              }))
            )}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="turma-nova">Turma</Label>
              <Input
                id="turma-nova"
                list="turmas-existentes"
                value={turma}
                onChange={(event) => setTurma(event.target.value)}
                placeholder="Ex.: 1º ano A"
                autoComplete="off"
              />
              <datalist id="turmas-existentes">
                {turmasExistentes.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="turma-data">Data (opcional)</Label>
              <Input
                id="turma-data"
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
              />
            </div>
            <Button type="button" variant="outline" onClick={addTurma}>
              <PlusIcon />
              Adicionar
            </Button>
          </div>

          {aplicacoes.length > 0 && (
            <ul className="space-y-2">
              {aplicacoes.map((item, index) => (
                <li
                  key={`${item.turma}-${index}`}
                  className="flex flex-wrap items-end gap-2 rounded-lg border p-2"
                >
                  <div className="flex-1 text-sm font-medium">{item.turma}</div>
                  <Input
                    type="date"
                    value={item.data}
                    onChange={(event) => updateData(index, event.target.value)}
                    aria-label={`Data da turma ${item.turma}`}
                    className="w-40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remover ${item.turma}`}
                    onClick={() => removeTurma(index)}
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
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
