import { TabsList, TabsTrigger } from "@/components/ui/tabs"

type AtividadeTabsListProps = {
  modo: "criar" | "editar"
  alunosCount?: number
}

/**
 * Abas compartilhadas: Configurações → Alunos.
 *
 * Na criação, Alunos fica desabilitada porque o código de entrada só existe
 * depois que a atividade é criada.
 */
export function AtividadeTabsList({
  modo,
  alunosCount = 0,
}: AtividadeTabsListProps) {
  const criando = modo === "criar"

  return (
    <TabsList variant="line">
      <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
      <TabsTrigger
        value="alunos"
        disabled={criando}
        title={criando ? "Disponível depois de criar a atividade" : undefined}
        aria-label={
          criando
            ? "Alunos (disponível depois de criar a atividade)"
            : `Alunos (${alunosCount})`
        }
      >
        Alunos{criando ? "" : ` (${alunosCount})`}
      </TabsTrigger>
    </TabsList>
  )
}
