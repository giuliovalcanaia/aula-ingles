import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

function App() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState("")

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Hello World</h1>
          <p className="text-muted-foreground text-lg">
            Projeto React + Vite + shadcn/ui configurado com sucesso!
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Badge>React</Badge>
            <Badge variant="secondary">Vite</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="destructive">shadcn/ui</Badge>
          </div>
        </div>

        {/* Counter Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contador Interativo</CardTitle>
            <CardDescription>
              Um exemplo simples de estado com componentes do shadcn/ui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <span className="text-6xl font-bold">{count}</span>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setCount(c => c - 1)}>
                -1
              </Button>
              <Button onClick={() => setCount(c => c + 1)}>
                +1
              </Button>
              <Button variant="secondary" onClick={() => setCount(0)}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Input Controlado</CardTitle>
            <CardDescription>
              Teste o componente Input do shadcn/ui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Digite seu nome..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {name && (
              <p className="text-sm text-muted-foreground">
                Olá, <span className="font-semibold text-foreground">{name}</span>!
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setName("")}>
              Limpar
            </Button>
            <Button size="sm" disabled={!name}>
              Enviar
            </Button>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Projeto configurado para integração com Supabase.
        </p>
      </div>
    </div>
  )
}

export default App
