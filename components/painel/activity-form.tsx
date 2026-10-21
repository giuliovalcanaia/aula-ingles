"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusIcon, Trash2Icon } from "lucide-react"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { DatePicker } from "@/components/painel/date-picker"
import { SubmitButton } from "@/components/painel/submit-button"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  turmasExistentes?: string[]
  atividade?: AtividadeFormData
  /** Pasta de destino; a atividade é criada no diretório aberto no painel. */
  pastaId?: number | null
  cancelHref?: string
}

export function ActivityForm({
  action,
  turmasExistentes = [],
  atividade,
  pastaId,
  cancelHref,
}: ActivityFormProps) {
  const editando = Boolean(atividade)
  const [aplicacoes, setAplicacoes] = useState<TurmaAplicacao[]>([])
  const [turma, setTurma] = useState("")
  const [data, setData] = useState("")
  const destinoId = atividade?.pasta_id ?? pastaId ?? null

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

  // Enter no campo de turma não deve enviar o formulário: ele adiciona a
  // turma à lista.
  function adicionarComEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    addTurma()
  }

  return (
    <ActionForm action={action} className="flex flex-col gap-6">
      {atividade && <input type="hidden" name="id" value={atividade.id} />}
      <input type="hidden" name="pasta_id" value={destinoId ?? ""} />
      {!editando && (
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
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="titulo">Título</FieldLabel>
          <Input
            id="titulo"
            name="titulo"
            placeholder="Ex.: Can / Can't"
            defaultValue={atividade?.titulo}
            autoFocus={!editando}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="subtitulo">Subtítulo</FieldLabel>
          <Textarea
            id="subtitulo"
            name="subtitulo"
            placeholder="Ex.: Exercícios de can / can't"
            defaultValue={atividade?.subtitulo ?? ""}
            rows={2}
          />
          <FieldDescription>
            Opcional. Aparece para o aluno logo acima dos links.
          </FieldDescription>
        </Field>

        {!editando && (
          <Field>
            <FieldLabel htmlFor="senha">Senha de liberação</FieldLabel>
            <Input
              id="senha"
              name="senha"
              type="password"
              minLength={4}
              placeholder="Mínimo de 4 caracteres"
              autoComplete="new-password"
              required
            />
            <FieldDescription>
              O aluno digita esta senha para concluir cada link. Ela vale para
              todas as turmas desta atividade.
            </FieldDescription>
          </Field>
        )}
      </FieldGroup>

      {!editando && (
        <FieldSet>
          <FieldLegend>Turmas</FieldLegend>
          <FieldDescription>
            Cada turma recebe um código de entrada e uma lista de nomes própria.
            Escolha uma turma existente ou digite uma nova.
          </FieldDescription>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="turma-nova">Turma</FieldLabel>
              <Input
                id="turma-nova"
                list="turmas-existentes"
                value={turma}
                onChange={(event) => setTurma(event.target.value)}
                onKeyDown={adicionarComEnter}
                placeholder="Ex.: 1º ano A"
                autoComplete="off"
              />
              <datalist id="turmas-existentes">
                {turmasExistentes.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </Field>
            <Field className="sm:w-40">
              <FieldLabel htmlFor="turma-data">Data</FieldLabel>
              <DatePicker
                id="turma-data"
                value={data}
                onChange={setData}
                placeholder="Data"
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              onClick={addTurma}
              disabled={!turma.trim()}
            >
              <PlusIcon data-icon="inline-start" />
              Adicionar
            </Button>
          </div>

          {aplicacoes.length > 0 ? (
            <FieldGroup className="gap-2">
              {aplicacoes.map((item, index) => (
                <Field
                  key={`${item.turma}-${index}`}
                  orientation="horizontal"
                  className="rounded-lg border p-2"
                >
                  <FieldTitle className="flex-1">{item.turma}</FieldTitle>
                  <DatePicker
                    value={item.data}
                    onChange={(value) => updateData(index, value)}
                    aria-label={`Data da turma ${item.turma}`}
                    placeholder="Data"
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
                </Field>
              ))}
            </FieldGroup>
          ) : (
            <FieldDescription>
              Nenhuma turma adicionada ainda. A atividade precisa de pelo menos
              uma para ser publicada.
            </FieldDescription>
          )}
        </FieldSet>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {cancelHref && (
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancelar
          </Link>
        )}
        <SubmitButton pendingLabel={editando ? "Salvando..." : "Criando..."}>
          {editando ? "Salvar atividade" : "Criar atividade"}
        </SubmitButton>
      </div>
    </ActionForm>
  )
}
