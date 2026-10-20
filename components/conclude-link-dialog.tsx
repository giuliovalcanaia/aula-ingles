"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KeyRoundIcon } from "lucide-react"

import { completeLink } from "@/app/atividade/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"

const errorMessages: Record<string, string> = {
  invalid_password: "Senha incorreta. Confira com o professor.",
  link_locked: "Este link não está disponível para conclusão.",
  password_not_set: "O professor ainda não definiu a senha desta atividade.",
  not_a_student: "Sessão expirada. Entre novamente.",
  not_authenticated: "Sessão expirada. Entre novamente.",
  password_required: "Digite a senha.",
}

export function ConcludeLinkDialog({
  linkId,
  titulo,
}: {
  linkId: number
  titulo: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [senha, setSenha] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = senha.trim()

    if (!value) {
      toast.add({ type: "warning", title: "Digite a senha da atividade." })
      return
    }

    startTransition(async () => {
      const result = await completeLink(linkId, value)

      if (result.error) {
        toast.add({
          type: "error",
          title: errorMessages[result.error] ?? "Não foi possível concluir.",
        })
        return
      }

      setOpen(false)
      setSenha("")
      toast.add({
        type: "success",
        title: "Atividade concluída!",
        description: "O próximo link foi liberado.",
      })
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" />}
        aria-label={`Concluir ${titulo}`}
      >
        <KeyRoundIcon />
        Concluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir: {titulo}</DialogTitle>
          <DialogDescription>
            Digite a senha que o professor passou para liberar o próximo link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`senha-link-${linkId}`}>Senha</Label>
            <Input
              id={`senha-link-${linkId}`}
              type="password"
              autoComplete="off"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Verificando..." : "Liberar próximo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
