"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

export function SubmitButton({
  children,
  pendingLabel = "Salvando...",
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" {...props} disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
