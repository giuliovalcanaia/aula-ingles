"use client"

import { useState } from "react"
import { flushSync } from "react-dom"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { AtividadeCabecalho } from "@/components/painel/atividade-cabecalho"
import { AtividadeCampos } from "@/components/painel/atividade-campos"
import { AtividadeTabsList } from "@/components/painel/atividade-tabs-list"
import { LinksTextarea } from "@/components/painel/links-textarea"
import { SenhaField } from "@/components/painel/senha-field"
import { SubmitButton } from "@/components/painel/submit-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"

type NovaAtividadeFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  pastaId: number | null
  pastaNome: string | null
  voltarHref: string
}

export function NovaAtividadeForm({
  action,
  pastaId,
  pastaNome,
  voltarHref,
}: NovaAtividadeFormProps) {
  const [aba, setAba] = useState("configuracoes")

  // Os campos de Configurações ficam ocultos quando outra aba está ativa, e
  // um campo oculto não pode receber foco. Voltamos para a aba antes de deixar
  // a validação nativa apontar o que falta.
  function mostrarConfiguracoesAntesDeEnviar() {
    if (aba !== "configuracoes") {
      flushSync(() => setAba("configuracoes"))
    }
  }

  return (
    <ActionForm action={action} className="flex flex-col gap-6">
      <input type="hidden" name="pasta_id" value={pastaId ?? ""} />

      <AtividadeCabecalho
        voltarHref={voltarHref}
        titulo="Nova atividade"
        subtitulo="A atividade nasce como rascunho. Preencha os dados e adicione os links; depois de criar, você poderá publicar."
        badge={{ label: "Rascunho", variant: "secondary" }}
        meta={<span>Pasta: {pastaNome ?? "Sem pasta"}</span>}
        acoes={
          <SubmitButton
            onClick={mostrarConfiguracoesAntesDeEnviar}
            pendingLabel="Criando..."
          >
            Criar atividade
          </SubmitButton>
        }
      />

      <Tabs
        value={aba}
        onValueChange={(value) => setAba(String(value))}
        className="gap-4"
      >
        <AtividadeTabsList modo="criar" linksCount={0} />

        <TabsContent value="configuracoes" keepMounted className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da atividade</CardTitle>
              <CardDescription>
                Título e subtítulo que o aluno vê.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AtividadeCampos autoFocus />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Senha de liberação</CardTitle>
              <CardDescription>
                A senha vale para todos os alunos desta atividade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SenhaField label="Senha" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" keepMounted>
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>
                Um link por linha, na ordem em que o aluno deve fazer. Você pode
                criar a atividade vazia e completar os links depois.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinksTextarea id="links-nova-atividade" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ActionForm>
  )
}
