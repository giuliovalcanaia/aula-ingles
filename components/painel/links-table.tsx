"use client"

import { useOptimistic, useState, useTransition, type DragEvent } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  PlusIcon,
} from "lucide-react"

import { reorderLinks, type ActionResult } from "@/app/painel/actions"
import { BuscarNaPaginaButton } from "@/components/painel/buscar-na-pagina-button"
import { ConfirmAction } from "@/components/painel/confirm-action"
import { LinkForm } from "@/components/painel/link-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export type LinkRowData = {
  id: number
  titulo: string
  href: string
}

type FormAction = (
  state: ActionResult,
  formData: FormData
) => Promise<ActionResult>

type LinksTableProps = {
  atividadeId: number
  links: LinkRowData[]
  createAction: FormAction
  deleteAction: FormAction
}

type LinkRowProps = {
  atividadeId: number
  link: LinkRowData
  index: number
  total: number
  deleteAction: FormAction
  arrastando: boolean
  sobre: boolean
  onArrastarInicio: (event: DragEvent<HTMLButtonElement>, id: number) => void
  onArrastarSobre: (event: DragEvent<HTMLTableRowElement>, id: number) => void
  onSoltar: (event: DragEvent<HTMLTableRowElement>, id: number) => void
  onArrastarFim: () => void
  onMover: (id: number, direcao: -1 | 1) => void
}

// Inputs "fantasma" da tabela: a borda só aparece no hover/focus, como no
// bloco dashboard-01 do shadcn.
const CAMPO_INLINE =
  "border-transparent bg-transparent shadow-none hover:bg-input/30 focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"

const GRUPO_INLINE =
  "border-transparent bg-transparent shadow-none hover:bg-input/30 focus-within:bg-background dark:bg-transparent dark:hover:bg-input/30"

function LinkRow({
  atividadeId,
  link,
  index,
  total,
  deleteAction,
  arrastando,
  sobre,
  onArrastarInicio,
  onArrastarSobre,
  onSoltar,
  onArrastarFim,
  onMover,
}: LinkRowProps) {
  const [titulo, setTitulo] = useState(link.titulo)
  const [href, setHref] = useState(link.href)

  function avisarErro(mensagem: string | null) {
    if (mensagem) toast.add({ type: "error", title: mensagem })
  }

  return (
    <TableRow
      data-dragging={arrastando}
      data-over={sobre}
      className="data-[dragging=true]:opacity-50 data-[over=true]:bg-muted/60"
      onDragOver={(event) => onArrastarSobre(event, link.id)}
      onDrop={(event) => onSoltar(event, link.id)}
      onDragEnd={onArrastarFim}
    >
      <TableCell className="w-8 pr-0">
        <div className="hidden sm:block">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            draggable
            onDragStart={(event) => {
              const row = event.currentTarget.closest("tr")
              if (row) event.dataTransfer.setDragImage(row, 16, 16)
              event.dataTransfer.effectAllowed = "move"
              onArrastarInicio(event, link.id)
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") {
                event.preventDefault()
                onMover(link.id, -1)
              }

              if (event.key === "ArrowDown") {
                event.preventDefault()
                onMover(link.id, 1)
              }
            }}
            aria-label={`Reordenar “${link.titulo}”. Arraste ou use as setas para cima e para baixo.`}
            className="cursor-grab text-muted-foreground active:cursor-grabbing"
          >
            <GripVerticalIcon />
          </Button>
        </div>

        <div className="flex flex-col sm:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onMover(link.id, -1)}
            disabled={index === 0}
            aria-label="Mover para cima"
          >
            <ArrowUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onMover(link.id, 1)}
            disabled={index === total - 1}
            aria-label="Mover para baixo"
          >
            <ArrowDownIcon />
          </Button>
        </div>
      </TableCell>

      <TableCell className="w-8 text-center text-sm text-muted-foreground tabular-nums">
        {index + 1}
      </TableCell>

      <TableCell className="min-w-48">
        <Label htmlFor={`titulo-${link.id}`} className="sr-only">
          Título
        </Label>
        <Input
          id={`titulo-${link.id}`}
          name={`titulo-${link.id}`}
          form="links-form"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Ex.: Exercise 1"
          className={CAMPO_INLINE}
          required
        />
      </TableCell>

      <TableCell className="min-w-64">
        <Label htmlFor={`href-${link.id}`} className="sr-only">
          URL
        </Label>
        <InputGroup className={GRUPO_INLINE}>
          <InputGroupInput
            id={`href-${link.id}`}
            name={`href-${link.id}`}
            form="links-form"
            type="text"
            inputMode="url"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder="google.com ou https://..."
            required
          />
          <InputGroupAddon align="inline-end">
            <BuscarNaPaginaButton
              href={href}
              onTitulo={setTitulo}
              onErro={avisarErro}
            />
          </InputGroupAddon>
        </InputGroup>
      </TableCell>

      <TableCell className="w-10 text-right">
        <ConfirmAction
          action={deleteAction}
          fields={{ id: link.id, atividade_id: atividadeId }}
          title="Excluir este link?"
          description="O progresso dos alunos nesse link também será excluído."
        />
      </TableCell>
    </TableRow>
  )
}

export function LinksTable({
  atividadeId,
  links,
  createAction,
  deleteAction,
}: LinksTableProps) {
  const [linksOrdenados, aplicarOrdem] = useOptimistic(
    links,
    (atual, ids: number[]) =>
      ids.flatMap((id) => {
        const link = atual.find((item) => item.id === id)
        return link ? [link] : []
      })
  )
  const [reordenando, iniciarReordenacao] = useTransition()
  const [arrastandoId, setArrastandoId] = useState<number | null>(null)
  const [sobreId, setSobreId] = useState<number | null>(null)
  const [adicionando, setAdicionando] = useState(links.length === 0)

  function persistirOrdem(ids: number[]) {
    iniciarReordenacao(async () => {
      aplicarOrdem(ids)

      const resultado = await reorderLinks(atividadeId, ids)

      if (resultado.error) {
        toast.add({ type: "error", title: resultado.error })
      }
    })
  }

  function mover(id: number, direcao: -1 | 1) {
    if (reordenando) return

    const ids = linksOrdenados.map((link) => link.id)
    const de = ids.indexOf(id)
    const para = de + direcao

    if (de < 0 || para < 0 || para >= ids.length) return

    const novos = [...ids]
    const [movido] = novos.splice(de, 1)
    novos.splice(para, 0, movido)
    persistirOrdem(novos)
  }

  function arrastarSobre(event: DragEvent<HTMLTableRowElement>, id: number) {
    if (!arrastandoId || arrastandoId === id) return

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setSobreId(id)
  }

  function soltar(event: DragEvent<HTMLTableRowElement>, destinoId: number) {
    event.preventDefault()
    setSobreId(null)

    const origemId = arrastandoId
    setArrastandoId(null)

    if (!origemId || origemId === destinoId || reordenando) return

    const ids = linksOrdenados.map((link) => link.id)
    const de = ids.indexOf(origemId)
    const para = ids.indexOf(destinoId)

    if (de < 0 || para < 0) return

    const novos = [...ids]
    const [movido] = novos.splice(de, 1)
    novos.splice(para, 0, movido)
    persistirOrdem(novos)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Links</CardTitle>
        <CardDescription>
          Reordene arrastando pelo ícone ou usando as setas. Depois use “Salvar
          links”.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdicionando(true)}
            disabled={adicionando}
          >
            <PlusIcon data-icon="inline-start" />
            Adicionar link
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        {linksOrdenados.length > 0 && (
          <Table className="min-w-[44rem]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {linksOrdenados.map((link, index) => (
                <LinkRow
                  key={`${link.id}-${link.titulo}-${link.href}`}
                  atividadeId={atividadeId}
                  link={link}
                  index={index}
                  total={linksOrdenados.length}
                  deleteAction={deleteAction}
                  arrastando={arrastandoId === link.id}
                  sobre={sobreId === link.id && arrastandoId !== link.id}
                  onArrastarInicio={(_, id) => setArrastandoId(id)}
                  onArrastarSobre={arrastarSobre}
                  onSoltar={soltar}
                  onArrastarFim={() => {
                    setArrastandoId(null)
                    setSobreId(null)
                  }}
                  onMover={mover}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {linksOrdenados.length === 0 && !adicionando && (
          <div className="mx-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum link adicionado ainda. Adicione pelo menos um para poder
            publicar a atividade.
          </div>
        )}

        {adicionando && (
          <div
            className={cn(
              "p-4",
              linksOrdenados.length > 0 && "border-t bg-muted/20"
            )}
          >
            <LinkForm
              action={createAction}
              atividadeId={atividadeId}
              submitLabel="Adicionar"
              pendingLabel="Adicionando..."
              onSuccess={() => setAdicionando(false)}
              onCancel={() => setAdicionando(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
