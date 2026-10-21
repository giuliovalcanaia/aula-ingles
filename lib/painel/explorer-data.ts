import { createClient } from "@/lib/supabase/server"
import { pastaBreadcrumb, type PastaRow } from "@/lib/pastas"

export type AplicacaoInfo = {
  codigo: string
  turma: string
}

export type ExplorerAtividade = {
  id: number
  titulo: string
  subtitulo: string | null
  pasta_id: number | null
  status: string
  created_at: string
  updated_at: string
  links: number
  turmas: number
  aplicacoes: AplicacaoInfo[]
}

export type ExplorerPasta = PastaRow & {
  created_at: string
  pastaCount: number
  atividadeCount: number
}

export type ExplorerData = {
  pastas: PastaRow[]
  pastasAtuais: ExplorerPasta[]
  atividadesAtuais: ExplorerAtividade[]
  breadcrumb: PastaRow[]
  pastaAtual: PastaRow | null
}

/**
 * Carrega as pastas/atividades ativas do professor e monta apenas o
 * conteúdo da pasta atual. As consultas são protegidas por RLS.
 */
export async function loadExplorerData(
  pastaId: number | null
): Promise<ExplorerData | null> {
  const supabase = await createClient()

  const [
    { data: pastas },
    { data: atividades },
    { data: links },
    { data: aplicacoes },
    { data: turmas },
  ] = await Promise.all([
    supabase
      .from("pastas")
      .select("id, nome, parent_id, created_at")
      .is("deleted_at", null)
      .order("nome"),
    supabase
      .from("atividades")
      .select("id, titulo, subtitulo, pasta_id, status, created_at, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    supabase.from("links").select("atividade_id"),
    supabase.from("aplicacoes").select("atividade_id, codigo, turma_id"),
    supabase.from("turmas").select("id, nome"),
  ])

  const pastasAtivas = pastas ?? []
  const pastaAtual =
    pastaId === null
      ? null
      : (pastasAtivas.find((pasta) => pasta.id === pastaId) ?? null)

  if (pastaId !== null && !pastaAtual) return null

  const nomesTurmas = new Map(
    (turmas ?? []).map((turma) => [turma.id, turma.nome])
  )

  const linksPorAtividade = new Map<number, number>()
  for (const link of links ?? []) {
    linksPorAtividade.set(
      link.atividade_id,
      (linksPorAtividade.get(link.atividade_id) ?? 0) + 1
    )
  }

  const aplicacoesPorAtividade = new Map<number, AplicacaoInfo[]>()
  for (const aplicacao of aplicacoes ?? []) {
    const lista = aplicacoesPorAtividade.get(aplicacao.atividade_id) ?? []
    lista.push({
      codigo: aplicacao.codigo,
      turma: nomesTurmas.get(aplicacao.turma_id) ?? "Turma",
    })
    aplicacoesPorAtividade.set(aplicacao.atividade_id, lista)
  }

  const pastasPorPai = new Map<number | null, number>()
  for (const pasta of pastasAtivas) {
    pastasPorPai.set(
      pasta.parent_id,
      (pastasPorPai.get(pasta.parent_id) ?? 0) + 1
    )
  }

  const atividadesPorPasta = new Map<number | null, number>()
  for (const atividade of atividades ?? []) {
    atividadesPorPasta.set(
      atividade.pasta_id,
      (atividadesPorPasta.get(atividade.pasta_id) ?? 0) + 1
    )
  }

  const pastasAtuais: ExplorerPasta[] = pastasAtivas
    .filter((pasta) => pasta.parent_id === pastaId)
    .map((pasta) => ({
      ...pasta,
      pastaCount: pastasPorPai.get(pasta.id) ?? 0,
      atividadeCount: atividadesPorPasta.get(pasta.id) ?? 0,
    }))

  const atividadesAtuais: ExplorerAtividade[] = (atividades ?? [])
    .filter((atividade) => atividade.pasta_id === pastaId)
    .map((atividade) => {
      const apps = aplicacoesPorAtividade.get(atividade.id) ?? []
      return {
        ...atividade,
        links: linksPorAtividade.get(atividade.id) ?? 0,
        turmas: apps.length,
        aplicacoes: apps,
      }
    })

  return {
    pastas: pastasAtivas,
    pastasAtuais,
    atividadesAtuais,
    breadcrumb: pastaBreadcrumb(pastasAtivas, pastaId),
    pastaAtual,
  }
}
