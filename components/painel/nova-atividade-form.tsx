"use client"

import { useState } from "react"
import Link from "next/link"
import { flushSync } from "react-dom"

import type { ActionResult } from "@/app/painel/actions"
import { ActionForm } from "@/components/painel/action-form"
import { AtividadeCampos } from "@/components/painel/atividade-campos"
import { LinksTextarea } from "@/components/painel/links-textarea"
import { SenhaField } from "@/components/painel/senha-field"
import { SubmitButton } from "@/components/painel/submit-button"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type NovaAtividadeFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  pastaId: number | null
  pastaNome: string | null
  cancelHref: string
}

export function NovaAtividadeForm({
  action,
  pastaId,
  pastaNome,
  cancelHref,
}: NovaAtividadeFormProps) {
  const [aba, setAba] = useState("informacoes")

  // Os campos da aba de informações ficam ocultos quando outra aba está ativa,
  // e um campo oculto não pode receber foco: a validação nativa não conseguiria
  // apontar o que falta. Voltamos para a aba antes de deixar o envio acontecer.
  function mostrarInformacoesAntesDeEnviar() {
    if (aba !== "informacoes") flushSync(() => setAba("informacoes"))
  }

  return (
    <ActionForm action={action} className="flex flex-col gap-6">
      <input type="hidden" name="pasta_id" value={pastaId ?? ""} />

      <Tabs
        value={aba}
        onValueChange={(value) => setAba(String(value))}
        className="gap-4"
      >
        <TabsList variant="line">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes" keepMounted>
          <Card>
            <CardHeader>
              <CardTitle>Informações da atividade</CardTitle>
              <CardDescription>
                Defina o título e a senha da atividade.{" "}
                {pastaNome
                  ? `Ela será criada na pasta “${pastaNome}”.`
                  : "Ela será criada na raiz do painel."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <AtividadeCampos autoFocus />

              <SenhaField />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" keepMounted>
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>
                Você pode criar a atividade vazia e completar os links depois.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinksTextarea id="links-nova-atividade" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancelar
        </Link>
        <SubmitButton
          onClick={mostrarInformacoesAntesDeEnviar}
          pendingLabel="Criando..."
        >
          Criar atividade
        </SubmitButton>
      </div>
    </ActionForm>
  )
}
