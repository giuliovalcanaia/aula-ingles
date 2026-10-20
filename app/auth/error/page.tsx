import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Não foi possível confirmar</CardTitle>
          <CardDescription>
            O link de confirmação é inválido ou expirou. Entre com a sua conta
            ou crie uma nova.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <a href="/login" className={buttonVariants()}>
            Entrar
          </a>
          <a href="/signup" className={buttonVariants({ variant: "outline" })}>
            Criar conta
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
