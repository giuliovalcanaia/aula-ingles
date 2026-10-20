import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JoinCodeForm } from "@/components/join-code-form"

export default function Page() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <nav className="absolute top-4 right-4">
        <a href="/login" className={buttonVariants({ variant: "secondary" })}>
          Fazer login
        </a>
      </nav>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Insira o código da aula:</CardTitle>
        </CardHeader>
        <CardContent>
          <JoinCodeForm />
        </CardContent>
      </Card>
    </div>
  )
}
