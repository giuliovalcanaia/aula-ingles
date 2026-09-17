import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Button
        variant="outline"
        render={<Link href="/login" />}
        nativeButton={false}
      >
        Área do Professor
      </Button>
    </main>
  )
}
