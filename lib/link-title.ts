import { normalizeHttpUrl } from "./links"

/**
 * Busca o título de uma página para preencher o campo automaticamente.
 *
 * Roda só no servidor (as páginas dos exercícios não liberam CORS). Lê o
 * `<title>` do HTML e, se não houver, o `og:title`. Tem limite de tempo,
 * tamanho e redirecionamentos, e recusa endereços internos/privados.
 */

const TIMEOUT_MS = 6000
const MAX_BYTES = 512 * 1024
const MAX_REDIRECTS = 4
const TITLE_MAX_LENGTH = 140

export type LinkTitleError =
  "invalid_url" | "fetch_failed" | "not_html" | "no_title"

export type LinkTitleResult =
  { title: string; error: null } | { title: null; error: LinkTitleError }

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
}

function decodeEntities(value: string) {
  return value.replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (original, entidade: string) => {
      if (entidade.startsWith("#")) {
        const hex = entidade[1]?.toLowerCase() === "x"
        const codigo = Number.parseInt(
          entidade.slice(hex ? 2 : 1),
          hex ? 16 : 10
        )

        if (!Number.isFinite(codigo) || codigo < 1 || codigo > 0x10ffff) {
          return original
        }

        try {
          return String.fromCodePoint(codigo)
        } catch {
          return original
        }
      }

      return ENTIDADES[entidade.toLowerCase()] ?? original
    }
  )
}

function extractTitle(html: string) {
  const semComentarios = html.replace(/<!--[\s\S]*?-->/g, " ")

  const titleTag = semComentarios.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]

  const ogTag = semComentarios.match(
    /<meta[^>]+(?:property|name)\s*=\s*["']og:title["'][^>]*>/i
  )?.[0]

  const ogTitle = ogTag?.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]

  const bruto = (titleTag ?? "").trim() || (ogTitle ?? "").trim()
  const limpo = decodeEntities(bruto).replace(/\s+/g, " ").trim()

  if (!limpo) return null

  return limpo.slice(0, TITLE_MAX_LENGTH)
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "")

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true
  }

  // Qualquer IPv6 literal ("[::1]", "[fe80::1]", ...).
  if (host.startsWith("[")) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4) return false

  const a = Number(ipv4[1])
  const b = Number(ipv4[2])

  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 198 && (b === 18 || b === 19)) return true

  return false
}

async function readLimited(response: Response, maxBytes: number) {
  if (!response.body) return ""

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let html = ""
  let bytes = 0

  try {
    while (bytes < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break

      bytes += value.byteLength
      html += decoder.decode(value, { stream: true })
    }
  } finally {
    await reader.cancel().catch(() => {})
  }

  return html + decoder.decode()
}

export async function lookupLinkTitle(
  rawUrl: string
): Promise<LinkTitleResult> {
  const href = normalizeHttpUrl(rawUrl)
  if (!href) return { title: null, error: "invalid_url" }

  let current = new URL(href)

  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      if (isPrivateHostname(current.hostname)) {
        return { title: null, error: "invalid_url" }
      }

      const response = await fetch(current, {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
          "user-agent":
            "Mozilla/5.0 (compatible; AulaInglesLinkPreview/1.0; +https://example.com)",
        },
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        await response.body?.cancel().catch(() => {})

        if (!location) return { title: null, error: "fetch_failed" }

        current = new URL(location, current)

        if (current.protocol !== "http:" && current.protocol !== "https:") {
          return { title: null, error: "invalid_url" }
        }

        continue
      }

      if (!response.ok) return { title: null, error: "fetch_failed" }

      const contentType = response.headers.get("content-type") ?? ""
      if (!/html/i.test(contentType)) return { title: null, error: "not_html" }

      const declarado = Number(response.headers.get("content-length") ?? "0")
      if (declarado > MAX_BYTES) return { title: null, error: "fetch_failed" }

      const html = await readLimited(response, MAX_BYTES)
      const title = extractTitle(html)

      return title ? { title, error: null } : { title: null, error: "no_title" }
    }

    return { title: null, error: "fetch_failed" }
  } catch {
    return { title: null, error: "fetch_failed" }
  }
}
