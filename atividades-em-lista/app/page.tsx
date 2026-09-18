import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field } from "@/components/ui/field"

export default function Page() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <nav className="absolute top-4 right-4">
        <a href={"/login"} className={buttonVariants({ variant: "secondary" })}>
          Fazer login
        </a>
      </nav>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Insira o código da aula:</CardTitle>
        </CardHeader>
        <CardContent>
          <Field orientation="horizontal">
            <Input
              type="text"
              placeholder="Digite aqui"
              autoFocus
              className="uppercase placeholder:normal-case"
            />
            <Button>Entrar</Button>
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
