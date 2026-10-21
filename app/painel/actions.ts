"use server"

import { randomInt } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { separarChaves } from "@/lib/selecao"

export type ActionResult = {
  error: string | null
  success?: string | null
  trashId?: string | null
}

type Supabase = Awaited<ReturnType<typeof createClient>>

type AplicacaoInput = {
  turma: string
  data: string | null
}

type LinkInput = {
  titulo: string
  href: string
  descricao: string | null
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const STATUSES = ["aberta", "fazendo", "concluida", "bloqueada"] as const
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function optionalField(formData: FormData, name: string) {
  const value = field(formData, name)
  return value ? value : null
}

function idField(formData: FormData, name: string) {
  const value = Number(field(formData, name))
  return Number.isInteger(value) && value > 0 ? value : null
}

function fail(error: string): ActionResult {
  return { error }
}

function ok(success: string, trashId?: string): ActionResult {
  return { error: null, success, trashId }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return null
  return DATE_PATTERN.test(value) ? value : null
}

function parseAplicacoes(raw: string): AplicacaoInput[] | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null

    const aplicacoes: AplicacaoInput[] = []

    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue
      const turma = String((item as { turma?: unknown }).turma ?? "").trim()
      const data = normalizeDate(
        String((item as { data?: unknown }).data ?? "").trim() || null
      )

      if (turma) aplicacoes.push({ turma, data })
    }

    return aplicacoes
  } catch {
    return null
  }
}

function parseLinks(raw: string): LinkInput[] | null {
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null

    const links: LinkInput[] = []

    for (const item of parsed) {
      if (typeof item !== "object" || item === null) return null

      const { titulo, href, descricao } = item as {
        titulo?: unknown
        href?: unknown
        descricao?: unknown
      }

      const tituloLimpo = String(titulo ?? "").trim()
      const hrefLimpo = String(href ?? "").trim()

      if (!tituloLimpo || !isHttpUrl(hrefLimpo)) return null

      links.push({
        titulo: tituloLimpo,
        href: hrefLimpo,
        descricao: String(descricao ?? "").trim() || null,
      })
    }

    return links
  } catch {
    return null
  }
}

function parseChaves(raw: string): string[] {
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is string => typeof item === "string")
  } catch {
    return []
  }
}

async function getTeacher() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) return null

  const { data: professor } = await supabase
    .from("professores")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!professor) return null

  return { supabase, professorId: professor.id }
}

function revalidatePainel(extra?: string) {
  revalidatePath("/painel", "layout")
  revalidatePath("/painel/lixeira")
  if (extra) revalidatePath(extra)
}

async function generateCode(supabase: Supabase) {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
    }

    const { data } = await supabase
      .from("aplicacoes")
      .select("id")
      .eq("codigo", code)
      .maybeSingle()

    if (!data) return code
  }

  return null
}

async function resolveTurmaId(
  supabase: Supabase,
  professorId: number,
  nome: string
) {
  const nomeNormalizado = nome.trim()

  const { data: existentes } = await supabase
    .from("turmas")
    .select("id, nome")
    .eq("professor_id", professorId)

  const match = (existentes ?? []).find(
    (turma) => turma.nome.trim().toLowerCase() === nomeNormalizado.toLowerCase()
  )

  if (match) return match.id

  const { data, error } = await supabase
    .from("turmas")
    .insert({ nome: nomeNormalizado, professor_id: professorId })
    .select("id")
    .single()

  if (error || !data) {
    const { data: reconsulta } = await supabase
      .from("turmas")
      .select("id")
      .eq("professor_id", professorId)
      .eq("nome", nomeNormalizado)
      .maybeSingle()

    return reconsulta?.id ?? null
  }

  return data.id
}

// ---------------------------------------------------------
// Pastas
// ---------------------------------------------------------

async function pastaDescendants(supabase: Supabase, rootId: number) {
  const { data } = await supabase
    .from("pastas")
    .select("id, parent_id")
    .is("deleted_at", null)
  const children = new Map<number, number[]>()

  for (const pasta of data ?? []) {
    if (pasta.parent_id === null) continue
    const list = children.get(pasta.parent_id) ?? []
    list.push(pasta.id)
    children.set(pasta.parent_id, list)
  }

  const result = new Set<number>([rootId])
  const queue = [rootId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const child of children.get(current) ?? []) {
      if (result.has(child)) continue
      result.add(child)
      queue.push(child)
    }
  }

  return result
}

async function validarDestinoPasta(
  supabase: Supabase,
  pastaId: number,
  parentId: number | null
): Promise<string | null> {
  if (parentId === null) return null

  if (parentId === pastaId) {
    return "Uma pasta não pode ficar dentro dela mesma."
  }

  const descendants = await pastaDescendants(supabase, pastaId)
  if (descendants.has(parentId)) {
    return "Uma pasta não pode ficar dentro de uma subpasta dela."
  }

  const { data: parent } = await supabase
    .from("pastas")
    .select("id")
    .eq("id", parentId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!parent) return "Pasta de destino inválida."

  return null
}

async function movePastaTo(
  teacher: NonNullable<Awaited<ReturnType<typeof getTeacher>>>,
  id: number,
  parentId: number | null
): Promise<ActionResult> {
  const erroDestino = await validarDestinoPasta(teacher.supabase, id, parentId)
  if (erroDestino) return fail(erroDestino)

  const { data, error } = await teacher.supabase
    .from("pastas")
    .update({ parent_id: parentId })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) return fail("Pasta não encontrada.")

  revalidatePainel()
  return ok("Pasta movida.")
}

async function moveAtividadeTo(
  teacher: NonNullable<Awaited<ReturnType<typeof getTeacher>>>,
  id: number,
  pastaId: number | null
): Promise<ActionResult> {
  if (pastaId !== null) {
    const { data: pasta } = await teacher.supabase
      .from("pastas")
      .select("id")
      .eq("id", pastaId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!pasta) return fail("Pasta de destino inválida.")
  }

  const { data, error } = await teacher.supabase
    .from("atividades")
    .update({ pasta_id: pastaId })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) return fail("Atividade não encontrada.")

  revalidatePainel()
  return ok("Atividade movida.")
}

export async function createPasta(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const nome = field(formData, "nome")
  const parentId = idField(formData, "parent_id")

  if (!nome) return fail("Informe o nome da pasta.")

  if (parentId !== null) {
    const { data: parent } = await teacher.supabase
      .from("pastas")
      .select("id")
      .eq("id", parentId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!parent) return fail("Pasta de destino inválida.")
  }

  const { error } = await teacher.supabase.from("pastas").insert({
    nome,
    parent_id: parentId,
    professor_id: teacher.professorId,
  })

  if (error) return fail("Não foi possível criar a pasta.")

  revalidatePainel()
  return ok("Pasta criada.")
}

export async function renamePasta(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const nome = field(formData, "nome")

  if (!id) return fail("Pasta inválida.")
  if (!nome) return fail("Informe o nome da pasta.")

  const { data, error } = await teacher.supabase
    .from("pastas")
    .update({ nome })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) return fail("Não foi possível renomear a pasta.")

  revalidatePainel()
  return ok("Pasta renomeada.")
}

export async function movePasta(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const parentId = idField(formData, "parent_id")

  if (!id) return fail("Pasta inválida.")

  return movePastaTo(teacher, id, parentId)
}

export async function trashPasta(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Pasta inválida.")

  const { data, error } = await teacher.supabase.rpc("trash_pasta", {
    p_pasta_id: id,
  })

  if (error || !data)
    return fail("Não foi possível mover a pasta para a lixeira.")

  revalidatePainel()
  return ok("Pasta movida para a lixeira.", data)
}

export async function trashSelecionados(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const { pastas, atividades } = separarChaves(
    parseChaves(field(formData, "itens"))
  )
  const total = pastas.length + atividades.length

  if (total === 0) return fail("Nenhum item selecionado.")

  const { data, error } = await teacher.supabase.rpc("trash_items", {
    p_pastas: pastas,
    p_atividades: atividades,
  })

  if (error || !data)
    return fail("Não foi possível mover os itens para a lixeira.")

  revalidatePainel()
  return ok(
    total === 1
      ? "Item movido para a lixeira."
      : `${total} itens movidos para a lixeira.`,
    data
  )
}

export async function duplicatePasta(pastaId: number): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  if (!Number.isInteger(pastaId) || pastaId <= 0) return fail("Pasta inválida.")

  const { data, error } = await teacher.supabase.rpc("duplicate_pasta", {
    p_pasta_id: pastaId,
  })

  if (error || !data) return fail("Não foi possível duplicar a pasta.")

  revalidatePainel()
  return ok("Pasta duplicada.")
}

export async function moveItem(
  tipo: "pasta" | "atividade",
  id: number,
  pastaDestinoId: number | null
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  if (!Number.isInteger(id) || id <= 0) return fail("Item inválido.")

  if (tipo === "pasta") {
    return movePastaTo(teacher, id, pastaDestinoId)
  }

  return moveAtividadeTo(teacher, id, pastaDestinoId)
}

// ---------------------------------------------------------
// Atividades
// ---------------------------------------------------------

export async function createAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const titulo = field(formData, "titulo")
  const pastaId = idField(formData, "pasta_id")
  const senha = field(formData, "senha")
  const aplicacoes = parseAplicacoes(field(formData, "aplicacoes"))
  const links = parseLinks(field(formData, "links"))

  if (!titulo) return fail("Informe o título da atividade.")
  if (senha.length < 4)
    return fail("A senha precisa ter pelo menos 4 caracteres.")
  if (!aplicacoes || aplicacoes.length === 0) {
    return fail("Adicione pelo menos uma turma para a atividade.")
  }
  if (!links) return fail("Revise os links informados e tente novamente.")

  if (pastaId !== null) {
    const { data: pasta } = await teacher.supabase
      .from("pastas")
      .select("id")
      .eq("id", pastaId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!pasta) return fail("Pasta de destino inválida.")
  }

  const { data: atividade, error } = await teacher.supabase
    .from("atividades")
    .insert({
      titulo,
      subtitulo: optionalField(formData, "subtitulo"),
      pasta_id: pastaId,
      professor_id: teacher.professorId,
    })
    .select("id")
    .single()

  if (error || !atividade) {
    return fail("Não foi possível criar a atividade.")
  }

  const { error: senhaError } = await teacher.supabase.rpc(
    "set_activity_password",
    { p_atividade_id: atividade.id, p_senha: senha }
  )

  if (senhaError) {
    await teacher.supabase.from("atividades").delete().eq("id", atividade.id)
    return fail("Não foi possível definir a senha da atividade.")
  }

  if (links.length > 0) {
    const { error: linksError } = await teacher.supabase.from("links").insert(
      links.map((link, index) => ({
        atividade_id: atividade.id,
        titulo: link.titulo,
        descricao: link.descricao,
        href: link.href,
        ordem: index + 1,
      }))
    )

    if (linksError) {
      await teacher.supabase.from("atividades").delete().eq("id", atividade.id)
      return fail("Não foi possível adicionar os links.")
    }
  }

  for (const aplicacao of aplicacoes) {
    const turmaId = await resolveTurmaId(
      teacher.supabase,
      teacher.professorId,
      aplicacao.turma
    )

    if (!turmaId) {
      await teacher.supabase.from("atividades").delete().eq("id", atividade.id)
      return fail(`Não foi possível criar a turma "${aplicacao.turma}".`)
    }

    const codigo = await generateCode(teacher.supabase)

    if (!codigo) {
      await teacher.supabase.from("atividades").delete().eq("id", atividade.id)
      return fail("Não foi possível gerar o código de entrada.")
    }

    const { error: aplicacaoError } = await teacher.supabase
      .from("aplicacoes")
      .insert({
        atividade_id: atividade.id,
        turma_id: turmaId,
        codigo,
        data: aplicacao.data,
      })

    if (aplicacaoError) {
      await teacher.supabase.from("atividades").delete().eq("id", atividade.id)
      return fail("Não foi possível criar a turma da atividade.")
    }
  }

  revalidatePainel()
  redirect(`/painel/atividades/${atividade.id}`)
}

export async function updateAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Atividade inválida.")

  const titulo = field(formData, "titulo")
  if (!titulo) return fail("Informe o título da atividade.")

  const pastaId = idField(formData, "pasta_id")

  if (pastaId !== null) {
    const { data: pasta } = await teacher.supabase
      .from("pastas")
      .select("id")
      .eq("id", pastaId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!pasta) return fail("Pasta de destino inválida.")
  }

  const { data, error } = await teacher.supabase
    .from("atividades")
    .update({
      titulo,
      subtitulo: optionalField(formData, "subtitulo"),
      pasta_id: pastaId,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) return fail("Não foi possível salvar a atividade.")

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Atividade atualizada.")
}

export async function renameAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const titulo = field(formData, "titulo")

  if (!id) return fail("Atividade inválida.")
  if (!titulo) return fail("Informe o título da atividade.")

  const { data, error } = await teacher.supabase
    .from("atividades")
    .update({ titulo })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) return fail("Não foi possível renomear a atividade.")

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Atividade renomeada.")
}

export async function moveAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const pastaId = idField(formData, "pasta_id")

  if (!id) return fail("Atividade inválida.")

  return moveAtividadeTo(teacher, id, pastaId)
}

export async function updateActivityPassword(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "atividade_id")
  const senha = field(formData, "senha")

  if (!id) return fail("Atividade inválida.")
  if (senha.length < 4)
    return fail("A senha precisa ter pelo menos 4 caracteres.")

  const { error } = await teacher.supabase.rpc("set_activity_password", {
    p_atividade_id: id,
    p_senha: senha,
  })

  if (error) return fail("Não foi possível atualizar a senha.")

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Senha atualizada.")
}

export async function publishAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Atividade inválida.")

  const [{ data: senha }, { count: totalLinks }, { count: totalAplicacoes }] =
    await Promise.all([
      teacher.supabase
        .from("atividade_senhas")
        .select("atividade_id")
        .eq("atividade_id", id)
        .maybeSingle(),
      teacher.supabase
        .from("links")
        .select("id", { count: "exact", head: true })
        .eq("atividade_id", id),
      teacher.supabase
        .from("aplicacoes")
        .select("id", { count: "exact", head: true })
        .eq("atividade_id", id),
    ])

  if (!senha) return fail("Defina a senha da atividade antes de publicar.")
  if ((totalLinks ?? 0) === 0) {
    return fail("Adicione pelo menos um link antes de publicar.")
  }
  if ((totalAplicacoes ?? 0) === 0) {
    return fail("Adicione pelo menos uma turma antes de publicar.")
  }

  const { data, error } = await teacher.supabase
    .from("atividades")
    .update({ status: "publicada", publicada_em: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) return fail("Não foi possível publicar a atividade.")

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Atividade publicada.")
}

export async function unpublishAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Atividade inválida.")

  const { data, error } = await teacher.supabase
    .from("atividades")
    .update({ status: "rascunho", publicada_em: null })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) return fail("Não foi possível despublicar a atividade.")

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Atividade voltou para rascunho.")
}

export async function setAtividadePublicada(
  atividadeId: number,
  publicada: boolean
): Promise<ActionResult> {
  if (!Number.isInteger(atividadeId) || atividadeId <= 0) {
    return fail("Atividade inválida.")
  }

  const formData = new FormData()
  formData.set("id", String(atividadeId))

  return publicada
    ? publishAtividade({ error: null }, formData)
    : unpublishAtividade({ error: null }, formData)
}

export async function trashAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Atividade inválida.")

  const { data, error } = await teacher.supabase.rpc("trash_atividade", {
    p_atividade_id: id,
  })

  if (error || !data) {
    return fail("Não foi possível mover a atividade para a lixeira.")
  }

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Atividade movida para a lixeira.", data)
}

export async function duplicateAtividade(
  atividadeId: number
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  if (!Number.isInteger(atividadeId) || atividadeId <= 0) {
    return fail("Atividade inválida.")
  }

  const { data, error } = await teacher.supabase.rpc("duplicate_atividade", {
    p_atividade_id: atividadeId,
  })

  if (error || !data) return fail("Não foi possível duplicar a atividade.")

  revalidatePainel()
  return ok("Atividade duplicada.")
}

// ---------------------------------------------------------
// Lixeira
// ---------------------------------------------------------

export async function restoreTrash(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const trashId = field(formData, "trash_id")
  if (!trashId) return fail("Item da lixeira inválido.")

  const { error } = await teacher.supabase.rpc("restore_trash", {
    p_trash_id: trashId,
  })

  if (error) return fail("Não foi possível restaurar o item.")

  revalidatePainel()
  return ok("Item restaurado.")
}

export async function undoTrash(trashId: string): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  if (!trashId) return fail("Item da lixeira inválido.")

  const { error } = await teacher.supabase.rpc("restore_trash", {
    p_trash_id: trashId,
  })

  if (error) return fail("Não foi possível restaurar o item.")

  revalidatePainel()
  return ok("Item restaurado.")
}

export async function purgeTrash(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const trashId = field(formData, "trash_id")
  if (!trashId) return fail("Item da lixeira inválido.")

  const { error } = await teacher.supabase.rpc("purge_trash", {
    p_trash_id: trashId,
  })

  if (error) return fail("Não foi possível excluir o item definitivamente.")

  revalidatePainel()
  return ok("Item excluído definitivamente.")
}

export async function emptyTrash(
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const { error } = await teacher.supabase.rpc("empty_trash")

  if (error) return fail("Não foi possível esvaziar a lixeira.")

  revalidatePainel()
  return ok("Lixeira esvaziada.")
}

// ---------------------------------------------------------
// Turmas da atividade (aplicações)
// ---------------------------------------------------------

export async function createAplicacao(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const atividadeId = idField(formData, "atividade_id")
  const turma = field(formData, "turma")
  const data = normalizeDate(optionalField(formData, "data"))

  if (!atividadeId) return fail("Atividade inválida.")
  if (!turma) return fail("Informe a turma.")

  const turmaId = await resolveTurmaId(
    teacher.supabase,
    teacher.professorId,
    turma
  )

  if (!turmaId) return fail("Não foi possível criar a turma.")

  const codigo = await generateCode(teacher.supabase)
  if (!codigo) return fail("Não foi possível gerar o código de entrada.")

  const { error } = await teacher.supabase.from("aplicacoes").insert({
    atividade_id: atividadeId,
    turma_id: turmaId,
    codigo,
    data,
  })

  if (error) return fail("Não foi possível adicionar a turma.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Turma adicionada.")
}

export async function updateAplicacao(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const atividadeId = idField(formData, "atividade_id")
  const data = normalizeDate(optionalField(formData, "data"))

  if (!id || !atividadeId) return fail("Turma inválida.")

  const { error } = await teacher.supabase
    .from("aplicacoes")
    .update({ data })
    .eq("id", id)

  if (error) return fail("Não foi possível salvar a turma.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Turma atualizada.")
}

export async function setAplicacaoStatus(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const atividadeId = idField(formData, "atividade_id")
  const status = field(formData, "status")

  if (!id || !atividadeId) return fail("Turma inválida.")
  if (status !== "aberta" && status !== "encerrada") {
    return fail("Situação inválida.")
  }

  const { error } = await teacher.supabase
    .from("aplicacoes")
    .update({ status })
    .eq("id", id)

  if (error) return fail("Não foi possível alterar a turma.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok(status === "encerrada" ? "Turma encerrada." : "Turma reaberta.")
}

export async function deleteAplicacao(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const atividadeId = idField(formData, "atividade_id")

  if (!id || !atividadeId) return fail("Turma inválida.")

  const { error } = await teacher.supabase
    .from("aplicacoes")
    .delete()
    .eq("id", id)

  if (error) return fail("Não foi possível excluir a turma.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Turma excluída.")
}

// ---------------------------------------------------------
// Links
// ---------------------------------------------------------

export async function createLink(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const atividadeId = idField(formData, "atividade_id")
  const titulo = field(formData, "titulo")
  const href = field(formData, "href")

  if (!atividadeId) return fail("Atividade inválida.")
  if (!titulo) return fail("Informe o título do link.")
  if (!isHttpUrl(href))
    return fail("Informe uma URL que comece com http:// ou https://.")

  const { data: ultimo } = await teacher.supabase
    .from("links")
    .select("ordem")
    .eq("atividade_id", atividadeId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await teacher.supabase.from("links").insert({
    atividade_id: atividadeId,
    titulo,
    descricao: optionalField(formData, "descricao"),
    href,
    ordem: (ultimo?.ordem ?? 0) + 1,
  })

  if (error) return fail("Não foi possível adicionar o link.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Link adicionado.")
}

export async function updateLink(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const atividadeId = idField(formData, "atividade_id")
  const titulo = field(formData, "titulo")
  const href = field(formData, "href")

  if (!id || !atividadeId) return fail("Link inválido.")
  if (!titulo) return fail("Informe o título do link.")
  if (!isHttpUrl(href))
    return fail("Informe uma URL que comece com http:// ou https://.")

  const { error } = await teacher.supabase
    .from("links")
    .update({
      titulo,
      descricao: optionalField(formData, "descricao"),
      href,
    })
    .eq("id", id)

  if (error) return fail("Não foi possível salvar o link.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Link atualizado.")
}

export async function deleteLink(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const atividadeId = idField(formData, "atividade_id")

  if (!id || !atividadeId) return fail("Link inválido.")

  const { error } = await teacher.supabase.from("links").delete().eq("id", id)

  if (error) return fail("Não foi possível excluir o link.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Link excluído.")
}

export async function moveLink(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const atividadeId = idField(formData, "atividade_id")
  const direcao = Number(field(formData, "direcao"))

  if (!id || !atividadeId) return fail("Link inválido.")
  if (direcao !== -1 && direcao !== 1) return fail("Direção inválida.")

  const { error } = await teacher.supabase.rpc("move_link", {
    p_link_id: id,
    p_direcao: direcao,
  })

  if (error) return fail("Não foi possível reordenar o link.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Ordem atualizada.")
}

// ---------------------------------------------------------
// Progresso (professor)
// ---------------------------------------------------------

export async function updateStudentProgress(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const atividadeId = idField(formData, "atividade_id")
  const participacaoId = idField(formData, "participacao_id")
  const linkId = idField(formData, "link_id")
  const status = field(formData, "status")
  const pontuacaoRaw = field(formData, "pontuacao")

  if (!atividadeId || !participacaoId || !linkId) {
    return fail("Progresso inválido.")
  }

  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return fail("Situação inválida.")
  }

  let pontuacao: number | null = null
  if (pontuacaoRaw) {
    const parsed = Number(pontuacaoRaw)
    if (!Number.isInteger(parsed) || parsed < 0) {
      return fail("A nota precisa ser um número inteiro maior ou igual a zero.")
    }
    pontuacao = parsed
  }

  const { error } = await teacher.supabase
    .from("progresso_estudante")
    .update({ status, pontuacao })
    .eq("participacao_id", participacaoId)
    .eq("link_id", linkId)

  if (error) return fail("Não foi possível salvar o progresso.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Progresso atualizado.")
}
