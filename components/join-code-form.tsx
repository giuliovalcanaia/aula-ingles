"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function JoinCodeForm() {
  const router = useRouter()
  const [codigo, setCodigo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = codigo.trim().toUpperCase()

    if (!value) {
      setError("Informe o código da aula.")
      return
    }

    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: valido, error: validateError } = await supabase.rpc(
      "validate_activity_code",
      { p_codigo: value }
    )

    if (validateError) {
      setLoading(false)
      setError("Não foi possível validar o código. Tente novamente.")
      return
    }

    if (!valido) {
      setLoading(false)
      setError("Código inválido. Confira com o professor.")
      return
    }

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
          disabled={loading}
          className="uppercase placeholder:normal-case"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Verificando..." : "Entrar"}
        </Button>
      </Field>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
