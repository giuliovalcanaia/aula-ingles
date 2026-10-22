"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useLinksDraft } from "@/components/painel/links-draft"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

/**
 * Impede que o professor saia (ou troque de aba) com links alterados e não
 * salvos.
 *
 * Links e botões de navegação do app abrem o AlertDialog. Fechar/atualizar a
 * aba usa o aviso nativo do navegador (`beforeunload`), que é o único
 * permitido nesse caso.
 */
export function UnsavedChangesGuard() {
  const {
    dirty,
    pendingAction,
    pedirAcao,
    limparAcao,
    descartarRascunho,
    setAbaAtiva,
    salvando,
  } = useLinksDraft()
  const router = useRouter()

  useEffect(() => {
    if (!dirty) return

    function aoSair(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", aoSair)
    return () => window.removeEventListener("beforeunload", aoSair)
  }, [dirty])

  useEffect(() => {
    if (!dirty) return

    function aoClicar(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const alvo = event.target instanceof Element ? event.target : null
      if (!alvo) return

      // Botões da sidebar que navegam via router.push (home e pastas).
      const navButton = alvo.closest("[data-nav-href]")

      if (navButton) {
        const href = navButton.getAttribute("data-nav-href")

        if (href) {
          event.preventDefault()
          event.stopPropagation()
          pedirAcao({ type: "navigate", href })
          return
        }
      }

      const link = alvo.closest("a[href]")

      if (!(link instanceof HTMLAnchorElement)) return
      if (link.target && link.target !== "_self") return
      if (link.hasAttribute("download")) return

      const destino = new URL(link.href, window.location.href)

      if (destino.origin !== window.location.origin) return

      // Link para a mesma página (só hash) não faz o professor sair.
      if (
        destino.pathname === window.location.pathname &&
        destino.search === window.location.search
      ) {
        return
      }

      event.preventDefault()
      pedirAcao({
        type: "navigate",
        href: `${destino.pathname}${destino.search}${destino.hash}`,
      })
    }

    document.addEventListener("click", aoClicar, true)
    return () => document.removeEventListener("click", aoClicar, true)
  }, [dirty, pedirAcao])

  function salvarEContinuar() {
    const form = document.getElementById("links-form")

    if (form instanceof HTMLFormElement) {
      form.requestSubmit()
    }
  }

  function descartarEContinuar() {
    const acao = pendingAction
    limparAcao()

    if (!acao) return

    if (acao.type === "tab") {
      descartarRascunho()
      setAbaAtiva(acao.value)
      return
    }

    router.push(acao.href)
  }

  return (
    <AlertDialog
      open={pendingAction !== null}
      onOpenChange={(aberto) => {
        if (!aberto && !salvando) limparAcao()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Salvar alterações nos links?</AlertDialogTitle>
          <AlertDialogDescription>
            Você alterou a lista de links e ainda não salvou. Se continuar sem
            salvar, as alterações serão perdidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap">
          <AlertDialogCancel disabled={salvando}>
            Continuar editando
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={descartarEContinuar}
            disabled={salvando}
          >
            Descartar
          </Button>
          <Button onClick={salvarEContinuar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
