import { TrashPage } from "@/components/painel/explorer/trash-page"
import { loadTrashData } from "@/lib/painel/trash-data"

export default async function Page() {
  const groups = await loadTrashData()

  return <TrashPage groups={groups} />
}
