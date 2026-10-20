import { createPasta, deletePasta, updatePasta } from "@/app/painel/actions"
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { createClient } from "@/lib/supabase/server"
import { flattenPastas } from "@/lib/pastas"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("pastas")
    .select("id, nome, parent_id")
    .order("nome")

  const arvore = flattenPastas(data ?? [])
  const parentById = new Map(
    (data ?? []).map((pasta) => [pasta.id, pasta.parent_id])
  )

  return (
    <div className="m-4 max-w-3xl space-y-6">
      <div>
        <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
          Pastas
        </h1>
        <p className="text-sm text-muted-foreground">
          Organize as atividades em pastas e subpastas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova pasta</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createPasta}
            resetOnSuccess
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="nome-pasta">Nome da pasta</Label>
              <Input
                id="nome-pasta"
                name="nome"
                placeholder="Ex.: Aulas de 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-nova">Dentro de</Label>
              <NativeSelect
                id="parent-nova"
                name="parent_id"
                defaultValue=""
                className="w-full sm:w-56"
              >
                <NativeSelectOption value="">Raiz</NativeSelectOption>
                {arvore.map((pasta) => (
                  <NativeSelectOption key={pasta.id} value={pasta.id}>
                    {"— ".repeat(pasta.depth)}
                    {pasta.nome}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <SubmitButton pendingLabel="Criando...">Criar pasta</SubmitButton>
          </ActionForm>
        </CardContent>
      </Card>

      {arvore.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma pasta criada ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {arvore.map((pasta) => (
            <Card key={pasta.id}>
              <CardContent className="flex flex-wrap items-end gap-3 pt-6">
                <ActionForm
                  action={updatePasta}
                  className="flex flex-1 flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="id" value={pasta.id} />
                  <div className="min-w-40 flex-1 space-y-2">
                    <Label htmlFor={`nome-${pasta.id}`}>Nome</Label>
                    <Input
                      id={`nome-${pasta.id}`}
                      name="nome"
                      defaultValue={pasta.nome}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`parent-${pasta.id}`}>Dentro de</Label>
                    <NativeSelect
                      id={`parent-${pasta.id}`}
                      name="parent_id"
                      defaultValue={parentById.get(pasta.id)?.toString() ?? ""}
                      className="w-full sm:w-56"
                    >
                      <NativeSelectOption value="">Raiz</NativeSelectOption>
                      {arvore
                        .filter((item) => item.id !== pasta.id)
                        .map((item) => (
                          <NativeSelectOption key={item.id} value={item.id}>
                            {"— ".repeat(item.depth)}
                            {item.nome}
                          </NativeSelectOption>
                        ))}
                    </NativeSelect>
                  </div>
                  <SubmitButton variant="outline" size="sm">
                    Salvar
                  </SubmitButton>
                </ActionForm>
                <CardDescription className="text-sm">
                  {pasta.depth === 0 ? "Raiz" : `Nível ${pasta.depth + 1}`}
                </CardDescription>
                <ConfirmAction
                  action={deletePasta}
                  fields={{ id: pasta.id }}
                  title={`Excluir a pasta "${pasta.nome}"?`}
                  description="As subpastas também serão excluídas. As atividades continuam existindo, mas ficam sem pasta."
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
