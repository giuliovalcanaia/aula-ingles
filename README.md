# Trilha

Plataforma para montar atividades em sequência e acompanhar o progresso dos
alunos.

O professor organiza as atividades em pastas, compartilha um código de entrada e
acompanha em tempo real em qual etapa cada aluno está. O aluno entra sem conta:
digita o nome, percorre os links na ordem definida e libera cada etapa com a
senha da atividade.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
  sobre [Base UI](https://base-ui.com)
- [Supabase](https://supabase.com): Auth (professor por e-mail/senha e aluno
  anônimo), Postgres com RLS e Realtime

## Rodando localmente

Requer Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local   # preencha com os dados do projeto Supabase
npm run dev
```

As duas variáveis necessárias estão em `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave
```

As migrations ficam em `supabase/migrations/` e são aplicadas com
`npx supabase db push` (ou pela interface do Supabase).

## Scripts

| Comando             | O que faz                                    |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                  |
| `npm run build`     | Build de produção (com checagem de tipos)    |
| `npm run typecheck` | `tsc --noEmit`                               |
| `npm run format`    | Prettier em `**/*.{ts,tsx}`                  |
