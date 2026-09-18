import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InputInline() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            Insira o seu nome:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Field orientation="horizontal">
            <Input type="text" placeholder="Digite aqui" autoFocus/>
            <Button>Pronto</Button>
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
