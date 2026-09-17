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
import Link from "next/link"

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Faça login na sua conta</CardTitle>
          {/*<CardDescription>*/}
          {/*  Digite o seu email abaixo para entrar*/}
          {/*</CardDescription>*/}
          <CardAction>
            <Button variant="link">Inscreva-se</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full">
            Entrar
          </Button>
          <Button variant="outline" className="w-full">
            Entrar com o Google
          </Button>
          {/*<Link href={"/"}*/}
          {/*      className={buttonVariants({variant: "link text-foreground"})}>*/}
          {/*  Voltar*/}
          {/*</Link>*/}
          {/*<Button variant="link" className="text-foreground cursor-pointer">*/}
          {/*  Voltar*/}
          {/*</Button>*/}
        </CardFooter>
      </Card>
    </main>
  )
}