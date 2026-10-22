// O React, em modo de desenvolvimento, mede cada componente com
// `performance.measure()`. Quando um Server Component chama `redirect()` ou
// `notFound()` no meio da renderização (é o caso do `app/atividade/page.tsx`),
// a medição pode receber um timestamp negativo e o navegador lança:
//
//   Failed to execute 'measure' on 'Performance':
//   'Page' cannot have a negative time stamp.
//
// É um bug conhecido do React/Next (vercel/next.js#86060) e só existe no
// bundle de desenvolvimento: a build de produção não roda essa instrumentação.
// Este patch descarta apenas essa falha específica para não derrubar o overlay
// do `next dev`. Remover quando o upstream for corrigido.
if (process.env.NODE_ENV === "development") {
  const medirOriginal = Performance.prototype.measure

  Performance.prototype.measure = function (
    this: Performance,
    nome: string,
    inicio?: string | PerformanceMeasureOptions,
    fim?: string
  ) {
    try {
      return medirOriginal.call(this, nome, inicio, fim)
    } catch (erro) {
      if (
        erro instanceof Error &&
        erro.message.includes("negative time stamp")
      ) {
        return undefined as unknown as PerformanceMeasure
      }

      throw erro
    }
  } as typeof medirOriginal
}
