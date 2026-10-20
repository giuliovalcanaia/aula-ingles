"use server"

import { randomInt } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type ActionResult = {
  error: string | null
  success?: string | null
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const STATUSES = ["aberta", "fazendo", "concluida", "bloqueada"] as const

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

function ok(success: string): ActionResult {
  return { error: null, success }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
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
  revalidatePath("/painel")
  revalidatePath("/painel/turmas")
  revalidatePath("/painel/pastas")
  if (extra) revalidatePath(extra)
}

// ---------------------------------------------------------
// Turmas
// ---------------------------------------------------------

export async function createTurma(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const nome = field(formData, "nome")
  if (!nome) return fail("Informe o nome da turma.")

  const { error } = await teacher.supabase
    .from("turmas")
    .insert({ nome, professor_id: teacher.professorId })

  if (error) return fail("Não foi possível criar a turma.")

  revalidatePainel()
  return ok("Turma criada.")
}

export async function updateTurma(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const nome = field(formData, "nome")

  if (!id) return fail("Turma inválida.")
  if (!nome) return fail("Informe o nome da turma.")

  const { error } = await teacher.supabase
    .from("turmas")
    .update({ nome })
    .eq("id", id)

  if (error) return fail("Não foi possível renomear a turma.")

  revalidatePainel()
  return ok("Turma atualizada.")
}

export async function deleteTurma(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Turma inválida.")

  const { error } = await teacher.supabase.from("turmas").delete().eq("id", id)

  if (error) return fail("Não foi possível excluir a turma.")

  revalidatePainel()
  return ok("Turma excluída.")
}

// ---------------------------------------------------------
// Pastas
// ---------------------------------------------------------

async function pastaDescendants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rootId: number
) {
  const { data } = await supabase.from("pastas").select("id, parent_id")
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

export async function createPasta(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const nome = field(formData, "nome")
  const parentId = idField(formData, "parent_id")

  if (!nome) return fail("Informe o nome da pasta.")

  const { error } = await teacher.supabase.from("pastas").insert({
    nome,
    parent_id: parentId,
    professor_id: teacher.professorId,
  })

  if (error) return fail("Não foi possível criar a pasta.")

  revalidatePainel()
  return ok("Pasta criada.")
}

export async function updatePasta(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  const nome = field(formData, "nome")
  const parentId = idField(formData, "parent_id")

  if (!id) return fail("Pasta inválida.")
  if (!nome) return fail("Informe o nome da pasta.")

  if (parentId !== null) {
    if (parentId === id)
      return fail("Uma pasta não pode ficar dentro dela mesma.")

    const descendants = await pastaDescendants(teacher.supabase, id)
    if (descendants.has(parentId)) {
      return fail("Uma pasta não pode ficar dentro de uma subpasta dela.")
    }
  }

  const { error } = await teacher.supabase
    .from("pastas")
    .update({ nome, parent_id: parentId })
    .eq("id", id)

  if (error) return fail("Não foi possível atualizar a pasta.")

  revalidatePainel()
  return ok("Pasta atualizada.")
}

export async function deletePasta(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Pasta inválida.")

  const { error } = await teacher.supabase.from("pastas").delete().eq("id", id)

  if (error) return fail("Não foi possível excluir a pasta.")

  revalidatePainel()
  return ok("Pasta excluída.")
}

// ---------------------------------------------------------
// Atividades
// ---------------------------------------------------------

async function generateCode(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
    }

    const { data } = await supabase
      .from("atividades")
      .select("id")
      .eq("codigo_atividade", code)
      .maybeSingle()

    if (!data) return code
  }

  return null
}

function normalizeCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12)
}

export async function createAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const titulo = field(formData, "titulo")
  const turmaId = idField(formData, "turma_id")
  const pastaId = idField(formData, "pasta_id")
  const dataRealizacao = optionalField(formData, "data_realizacao")
  const senha = field(formData, "senha")
  const codigoInformado = normalizeCode(field(formData, "codigo_atividade"))

  if (!titulo) return fail("Informe o título da atividade.")
  if (!turmaId) return fail("Selecione uma turma.")
  if (senha.length < 4)
    return fail("A senha precisa ter pelo menos 4 caracteres.")

  let codigo = codigoInformado
  if (codigo) {
    if (codigo.length < 4)
      return fail("O código precisa ter pelo menos 4 caracteres.")

    const { data: existente } = await teacher.supabase
      .from("atividades")
      .select("id")
      .eq("codigo_atividade", codigo)
      .maybeSingle()

    if (existente) return fail("Já existe uma atividade com esse código.")
  } else {
    const gerado = await generateCode(teacher.supabase)
    if (!gerado)
      return fail("Não foi possível gerar um código. Tente novamente.")
    codigo = gerado
  }

  const { data: atividade, error } = await teacher.supabase
    .from("atividades")
    .insert({
      titulo,
      subtitulo: optionalField(formData, "subtitulo"),
      turma_id: turmaId,
      pasta_id: pastaId,
      data_realizacao: dataRealizacao,
      codigo_atividade: codigo,
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
  const turmaId = idField(formData, "turma_id")
  const pastaId = idField(formData, "pasta_id")
  const codigo = normalizeCode(field(formData, "codigo_atividade"))

  if (!titulo) return fail("Informe o título da atividade.")
  if (!turmaId) return fail("Selecione uma turma.")
  if (codigo.length < 4)
    return fail("O código precisa ter pelo menos 4 caracteres.")

  const { data: existente } = await teacher.supabase
    .from("atividades")
    .select("id")
    .eq("codigo_atividade", codigo)
    .neq("id", id)
    .maybeSingle()

  if (existente) return fail("Já existe uma atividade com esse código.")

  const { data: atual } = await teacher.supabase
    .from("atividades")
    .select("turma_id")
    .eq("id", id)
    .maybeSingle()

  if (!atual) return fail("Atividade não encontrada.")

  if (atual.turma_id !== turmaId) {
    const { data: links } = await teacher.supabase
      .from("links")
      .select("id")
      .eq("atividade_id", id)

    const linkIds = (links ?? []).map((link) => link.id)

    if (linkIds.length > 0) {
      const { count } = await teacher.supabase
        .from("progresso_estudante")
        .select("estudante_id", { count: "exact", head: true })
        .in("link_id", linkIds)

      if ((count ?? 0) > 0) {
        return fail(
          "Não é possível trocar a turma depois que alunos começaram a atividade."
        )
      }
    }
  }

  const { error } = await teacher.supabase
    .from("atividades")
    .update({
      titulo,
      subtitulo: optionalField(formData, "subtitulo"),
      turma_id: turmaId,
      pasta_id: pastaId,
      data_realizacao: optionalField(formData, "data_realizacao"),
      codigo_atividade: codigo,
    })
    .eq("id", id)

  if (error) return fail("Não foi possível salvar a atividade.")

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Atividade atualizada.")
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

  const [{ data: senha }, { count: totalLinks }] = await Promise.all([
    teacher.supabase
      .from("atividade_senhas")
      .select("atividade_id")
      .eq("atividade_id", id)
      .maybeSingle(),
    teacher.supabase
      .from("links")
      .select("id", { count: "exact", head: true })
      .eq("atividade_id", id),
  ])

  if (!senha) return fail("Defina a senha da atividade antes de publicar.")
  if ((totalLinks ?? 0) === 0) {
    return fail("Adicione pelo menos um link antes de publicar.")
  }

  const { error } = await teacher.supabase
    .from("atividades")
    .update({ status: "publicada", publicada_em: new Date().toISOString() })
    .eq("id", id)

  if (error) return fail("Não foi possível publicar a atividade.")

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

  const { error } = await teacher.supabase
    .from("atividades")
    .update({ status: "rascunho", publicada_em: null })
    .eq("id", id)

  if (error) return fail("Não foi possível despublicar a atividade.")

  revalidatePainel(`/painel/atividades/${id}`)
  return ok("Atividade voltou para rascunho.")
}

export async function deleteAtividade(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await getTeacher()
  if (!teacher) return fail("Sessão expirada. Entre novamente.")

  const id = idField(formData, "id")
  if (!id) return fail("Atividade inválida.")

  const { error } = await teacher.supabase
    .from("atividades")
    .delete()
    .eq("id", id)

  if (error) return fail("Não foi possível excluir a atividade.")

  revalidatePainel()
  redirect("/painel")
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
  const estudanteId = idField(formData, "estudante_id")
  const linkId = idField(formData, "link_id")
  const status = field(formData, "status")
  const pontuacaoRaw = field(formData, "pontuacao")

  if (!atividadeId || !estudanteId || !linkId) {
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
    .eq("estudante_id", estudanteId)
    .eq("link_id", linkId)

  if (error) return fail("Não foi possível salvar o progresso.")

  revalidatePainel(`/painel/atividades/${atividadeId}`)
  return ok("Progresso atualizado.")
}
