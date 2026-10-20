export type PastaRow = {
  id: number
  nome: string
  parent_id: number | null
}

export type PastaNode = {
  id: number
  nome: string
  depth: number
}

export function flattenPastas(
  pastas: PastaRow[],
  parentId: number | null = null,
  depth = 0
): PastaNode[] {
  return pastas
    .filter((pasta) => pasta.parent_id === parentId)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .flatMap((pasta) => [
      { id: pasta.id, nome: pasta.nome, depth },
      ...flattenPastas(pastas, pasta.id, depth + 1),
    ])
}
