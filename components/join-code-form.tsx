"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function JoinCodeForm() {
  const router = useRouter()
  const [codigo, setCodigo] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = codigo.trim().toUpperCase()

    if (!value) {
      setError("Informe o código da aula.")
      return
    }

    setError(null)
    router.push(`/aluno?codigo=${encodeURIComponent(value)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Field orientation="horizontal">
        <Input
          type="text"
          name="codigoAula"
          placeholder="Digite aqui"
          autoFocus
          autoComplete="one-time-code"
          spellCheck={false}
          autoCapitalize="characters"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          className="uppercase placeholder:normal-case"
        />
        <Button type="submit">Entrar</Button>
      </Field>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
