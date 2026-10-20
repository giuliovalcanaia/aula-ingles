import type { EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

function safeNextPath(value: string | null) {
  if (!value) return "/painel"
  // Aceita somente caminhos internos: nunca "//host" ou URLs absolutas.
  if (!value.startsWith("/") || value.startsWith("//")) return "/painel"
  return value
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = safeNextPath(searchParams.get("next"))

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) redirect(next)
  }

  redirect("/auth/error")
}
