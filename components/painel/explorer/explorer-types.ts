import type {
  ExplorerAtividade,
  ExplorerPasta,
} from "@/lib/painel/explorer-data"

export type ExplorerPastaItem = ExplorerPasta & { tipo: "pasta" }
export type ExplorerAtividadeItem = ExplorerAtividade & { tipo: "atividade" }

export type ExplorerItem = ExplorerPastaItem | ExplorerAtividadeItem

export const ORDENS_EXPLORER = [
  "nome-asc",
  "nome-desc",
  "data-desc",
  "data-asc",
] as const

export type OrdemExplorer = (typeof ORDENS_EXPLORER)[number]

export function ehOrdemExplorer(value: string | null): value is OrdemExplorer {
  return ORDENS_EXPLORER.includes(value as OrdemExplorer)
}

export function isPasta(item: ExplorerItem): item is ExplorerPastaItem {
  return item.tipo === "pasta"
}

export function isAtividade(item: ExplorerItem): item is ExplorerAtividadeItem {
  return item.tipo === "atividade"
}

export function nomeDoItem(item: ExplorerItem) {
  return isPasta(item) ? item.nome : item.titulo
}
