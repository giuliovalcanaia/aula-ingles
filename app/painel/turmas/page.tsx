import { createTurma, deleteTurma, updateTurma } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { ConfirmAction } from "@/components/painel/confirm-action"
import { SubmitButton } from "@/components/painel/submit-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()

  const [{ data: turmas }, { data: estudantes }] = await Promise.all([
    supabase.from("turmas").select("id, nome").order("nome"),
    supabase.from("estudantes").select("id, turma_id"),
  ])

  const alunosPorTurma = new Map<number, number>()
  for (const estudante of estudantes ?? []) {
    alunosPorTurma.set(
      estudante.turma_id,
      (alunosPorTurma.get(estudante.turma_id) ?? 0) + 1
    )
  }

  return (
    <div className="m-4 max-w-3xl space-y-6">
      <div>
        <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
          Turmas
        </h1>
        <p className="text-sm text-muted-foreground">
          Cada atividade pertence a uma turma. Os alunos entram pelo código da
          atividade.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova turma</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createTurma}
            resetOnSuccess
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="nome-turma">Nome da turma</Label>
              <Input
                id="nome-turma"
                name="nome"
                placeholder="Ex.: Turma A - 2026"
                required
              />
            </div>
            <SubmitButton pendingLabel="Criando...">Criar turma</SubmitButton>
          </ActionForm>
        </CardContent>
      </Card>

      {!turmas || turmas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma turma cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma) => (
            <Card key={turma.id}>
              <CardContent className="flex flex-wrap items-center gap-3 pt-6">
                <ActionForm
                  action={updateTurma}
                  className="flex min-w-56 flex-1 items-center gap-2"
                >
                  <input type="hidden" name="id" value={turma.id} />
                  <Input
                    name="nome"
                    defaultValue={turma.nome}
                    aria-label="Nome da turma"
                  />
                  <SubmitButton variant="outline" size="sm">
                    Salvar
                  </SubmitButton>
                </ActionForm>
                <CardDescription className="text-sm">
                  {alunosPorTurma.get(turma.id) ?? 0} aluno(s)
                </CardDescription>
                <ConfirmAction
                  action={deleteTurma}
                  fields={{ id: turma.id }}
                  title={`Excluir a turma "${turma.nome}"?`}
                  description="As atividades, os links e o progresso dos alunos dessa turma também serão excluídos. Essa ação não pode ser desfeita."
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
