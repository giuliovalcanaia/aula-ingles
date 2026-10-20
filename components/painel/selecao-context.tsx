"use client"

import * as React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"

import { intervalo } from "@/lib/selecao"

type SelecionarOptions = {
  ctrl?: boolean
  shift?: boolean
  ordem: string[]
}

type SelecaoContextValue = {
  selecionados: Set<string>
  selecionar: (key: string, options: SelecionarOptions) => void
  definir: (keys: string[]) => void
  limpar: () => void
}

const SelecaoContext = createContext<SelecaoContextValue | null>(null)

export function SelecaoProvider({ children }: { children: React.ReactNode }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const ancora = useRef<string | null>(null)

  const limpar = useCallback(() => {
    ancora.current = null
    setSelecionados((anterior) => (anterior.size === 0 ? anterior : new Set()))
  }, [])

  const definir = useCallback((keys: string[]) => {
    setSelecionados(new Set(keys))
  }, [])

  const selecionar = useCallback(
    (key: string, { ctrl, shift, ordem }: SelecionarOptions) => {
      if (shift) {
        const base = ancora.current ?? key
        ancora.current = base
        const faixa = intervalo(ordem, base, key)

        setSelecionados((anterior) =>
          ctrl ? new Set([...anterior, ...faixa]) : new Set(faixa)
        )
        return
      }

      if (ctrl) {
        ancora.current = key
        setSelecionados((anterior) => {
          const proximo = new Set(anterior)
          if (proximo.has(key)) proximo.delete(key)
          else proximo.add(key)
          return proximo
        })
        return
      }

      ancora.current = key
      setSelecionados((anterior) =>
        anterior.size === 1 && anterior.has(key) ? anterior : new Set([key])
      )
    },
    []
  )

  const value = useMemo(
    () => ({ selecionados, selecionar, definir, limpar }),
    [selecionados, selecionar, definir, limpar]
  )

  return (
    <SelecaoContext.Provider value={value}>{children}</SelecaoContext.Provider>
  )
}

export function useSelecao() {
  const contexto = useContext(SelecaoContext)

  if (!contexto) {
    throw new Error("useSelecao precisa ser usado dentro de SelecaoProvider")
  }

  return contexto
}
