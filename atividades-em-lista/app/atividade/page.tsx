import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { ClickableCard } from "@/components/clickable-card"


export default function Page() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-4">
      {/*Título e descrição*/}
      <div className="m-4 mt-4">
        <h1 className="scroll-m-24 text-2xl font-semibold tracking-tight sm:text-3xl">
          Título da atividade
        </h1>
        <p className="text-muted-foreground sm:text-base">
          Aqui dá para adicionar uma descrição opcional. Caso a atividade exija
          alguma espécie de enunciado ou algo assim.
        </p>
        <Card className="mt-4">
          <CardHeader>
            <Progress value={56} className="w-full">
              <ProgressLabel>Progresso da Atividade</ProgressLabel>
              <ProgressValue />
            </Progress>
          </CardHeader>
        </Card>
      </div>
      {/*Cards com os links*/}
      <div className="m-4 mt-8 space-y-4">
        <ClickableCard href="#" title="Atividade 1" status="aberta" />
        <ClickableCard href="#" title="Atividade 2" status="fazendo" />
        <ClickableCard href="#" title="Atividade 3" status="concluida" />
        <ClickableCard href="#" title="Atividade 4" status="bloqueada" />
      </div>
    </div>
  )
}