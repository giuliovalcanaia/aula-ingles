"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"

import { TrashConfirm } from "@/components/painel/explorer/explorer-dialogs"
import { Button } from "@/components/ui/button"

export function TrashActivityButton({
  id,
  nome,
  redirectTo,
}: {
  id: number
  nome: string
  redirectTo: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" type="button" onClick={() => setOpen(true)}>
        <Trash2Icon data-icon="inline-start" />
        Mover para a lixeira
      </Button>
      <TrashConfirm
        open={open}
        onOpenChange={setOpen}
        tipo="atividade"
        id={id}
        nome={nome}
        redirectTo={redirectTo}
      />
    </>
  )
}
