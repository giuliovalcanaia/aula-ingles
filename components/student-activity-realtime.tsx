"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

/**
 * Mantém a tela do aluno sincronizada com o painel do professor:
 * status/nota dos links (progresso_estudante) e encerramento/reabertura da
 * entrada (aplicacoes) chegam pelo Realtime e disparam um refresh do Server
 * Component.
 *
 * Assina apenas INSERT/UPDATE: DELETE exigiria `replica identity full` e as
 * policies de RLS não são aplicadas a eventos de DELETE.
 */
export function StudentActivityRealtime({
  participacaoId,
  aplicacaoId,
}: {
  participacaoId: number
  aplicacaoId: number
}) {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    function agendarAtualizacao() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => router.refresh(), 250)
    }

    const canal = supabase
      .channel(`aluno-participacao-${participacaoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "progresso_estudante",
          filter: `participacao_id=eq.${participacaoId}`,
        },
        agendarAtualizacao
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "progresso_estudante",
          filter: `participacao_id=eq.${participacaoId}`,
        },
        agendarAtualizacao
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "aplicacoes",
          filter: `id=eq.${aplicacaoId}`,
        },
        agendarAtualizacao
      )
      .subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      void supabase.removeChannel(canal)
    }
  }, [participacaoId, aplicacaoId, router])

  return null
}
