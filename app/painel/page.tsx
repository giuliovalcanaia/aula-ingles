import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()

  const [{ data: atividades }, { data: turmas }] = await Promise.all([
    supabase
      .from("atividades")
      .select("id, titulo, subtitulo, codigo_atividade, turma_id")
      .order("created_at", { ascending: false }),
    supabase.from("turmas").select("id, nome"),
  ])

  const nomesTurmas = new Map(
    (turmas ?? []).map((turma) => [turma.id, turma.nome])
  )

  return (
    <div className="m-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
          Atividades
        </h1>
        <Button variant="outline" disabled>
          Nova atividade
        </Button>
      </div>

      {!atividades || atividades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não criou nenhuma atividade. A criação de atividades pela
          interface estará disponível em breve.
        </p>
      ) : (
        <div className="space-y-4">
          {atividades.map((atividade) => (
            <Card key={atividade.id}>
              <CardHeader>
                <CardTitle>{atividade.titulo}</CardTitle>
                {atividade.subtitulo && (
                  <p className="text-sm text-muted-foreground">
                    {atividade.subtitulo}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>Turma: {nomesTurmas.get(atividade.turma_id) ?? "—"}</span>
                <span>Código: {atividade.codigo_atividade}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
