"use client"

import { useLinksDraft } from "@/components/painel/links-draft"
import { LinksTextarea } from "@/components/painel/links-textarea"

/** Textarea da atividade ligada ao rascunho compartilhado da página. */
export function LinksEditorTextarea() {
  const { value, setValue, salvando } = useLinksDraft()

  return (
    <LinksTextarea
      id="links-atividade"
      form="links-form"
      value={value}
      onChange={setValue}
      disabled={salvando}
    />
  )
}
