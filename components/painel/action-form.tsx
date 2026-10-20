"use client"

import { useActionState, useEffect, useRef } from "react"

import type { ActionResult } from "@/app/painel/actions"
import { toast } from "@/components/ui/toast"

type ActionFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
  onSuccess?: () => void
}

export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
}: ActionFormProps) {
  const [state, formAction] = useActionState(action, { error: null })
  const formRef = useRef<HTMLFormElement>(null)
  const handled = useRef<ActionResult | null>(null)

  useEffect(() => {
    if (state === handled.current) return
    handled.current = state

    if (state.error) {
      toast.add({ type: "error", title: state.error })
      return
    }

    if (state.success) {
      toast.add({ type: "success", title: state.success })
      if (resetOnSuccess) formRef.current?.reset()
      onSuccess?.()
    }
  }, [state, resetOnSuccess, onSuccess])

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
    </form>
  )
}
