"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

/**
 * Mantém a aba Alunos atualizada enquanto o professor acompanha a turma:
 * nomes que entram (participacoes) e links concluídos (progresso_estudante)
 * chegam pelo Realtime e disparam um refresh do Server Component.
 *
 * Assina apenas INSERT/UPDATE: DELETE exigiria `replica identity full` e as
 * policies de RLS não são aplicadas a eventos de DELETE.
 */
export function AtividadeTempoReal({ atividadeId }: { atividadeId: number }) {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    function agendarAtualizacao() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => router.refresh(), 250)
    }

    const canal = supabase
      .channel(`atividade-${atividadeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "participacoes" },
        agendarAtualizacao
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "participacoes" },
        agendarAtualizacao
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "progresso_estudante" },
        agendarAtualizacao
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "progresso_estudante" },
        agendarAtualizacao
      )
      .subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      void supabase.removeChannel(canal)
    }
  }, [atividadeId, router])

  return null
}
