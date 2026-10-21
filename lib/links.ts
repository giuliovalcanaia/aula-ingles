/**
 * Normaliza um endereço digitado pelo professor.
 *
 * Aceita tanto a URL completa (`https://google.com/exercicio`) quanto o
 * endereço sem esquema (`google.com`, `www.google.com`), assumindo `https://`.
 * Devolve o endereço absoluto normalizado ou `null` quando não é http(s).
 */
export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  // Só http(s): evita transformar `ftp://x`, `mailto:x` ou `javascript:x` em
  // `https://...`. `localhost:3000` continua valendo (o ":" é porta, não esquema).
  const hasOutroEsquema =
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)

  if (hasOutroEsquema && !/^[a-z][a-z0-9+.-]*:\d+(?:[/?#]|$)/i.test(trimmed))
    return null

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(candidate)

    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (!url.hostname) return null

    return url.href
  } catch {
    return null
  }
}
