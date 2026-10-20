import type {
  ExplorerAtividade,
  ExplorerPasta,
} from "@/lib/painel/explorer-data"

export type ExplorerPastaItem = ExplorerPasta & { tipo: "pasta" }
export type ExplorerAtividadeItem = ExplorerAtividade & { tipo: "atividade" }

export type ExplorerItem = ExplorerPastaItem | ExplorerAtividadeItem

export function isPasta(item: ExplorerItem): item is ExplorerPastaItem {
  return item.tipo === "pasta"
}

export function isAtividade(item: ExplorerItem): item is ExplorerAtividadeItem {
  return item.tipo === "atividade"
}
