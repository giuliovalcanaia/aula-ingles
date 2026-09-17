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

export default function Page() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <nav className="absolute top-4 right-4">
        <a href={"/login"} className={buttonVariants({ variant: "secondary" })}>
          Fazer login
        </a>
      </nav>
      <Card className="w-full  max-w-sm">
        <CardHeader>
          <CardTitle>Insira o código da aula abaixo</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Input
                  type="text"
                  placeholder="Digite aqui"
                  className="uppercase placeholder:normal-case"
                  required
                  autoFocus
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="cursor-pointer w-full">
            Entrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
