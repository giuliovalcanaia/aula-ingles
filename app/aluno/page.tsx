import { redirect } from "next/navigation"

import { StudentNameForm } from "@/components/student-name-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>
}) {
  const { codigo } = await searchParams
  const codigoAtividade = codigo?.trim().toUpperCase()

  if (!codigoAtividade) redirect("/")

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (userId) {
    const { data: professor } = await supabase
      .from("professores")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (professor) redirect("/painel")
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Insira o seu nome:</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentNameForm codigo={codigoAtividade} />
        </CardContent>
      </Card>
    </div>
  )
}
