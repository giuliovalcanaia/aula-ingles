# AGENTS.md

## Layout

- The Next.js app lives at the repo root (`/home/giulio/aula-ingles`). Run every command from here.
- npm only (`package-lock.json`). Node >= 20 is required by the `cn` package.
- Supabase packages are installed. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` belong in `.env.local` at the repo root; never commit that file.

## Commands

- `npm run dev` — Next.js dev server (Turbopack).
- `npm run typecheck` — `tsc --noEmit`. Passes on the current tree.
- `npm run build` — production build; also runs the TypeScript check. Passes on the current tree.
- `npm run format` — Prettier for `**/*.{ts,tsx}` only (no semicolons, double quotes, 2 spaces, sorted Tailwind classes).
- `npm run lint` is currently broken before linting any file: ESLint 10.10 crashes with `eslint-config-next`'s `eslint-plugin-react` 7.37.5 (supports ESLint <= 9). Do not treat this as a regression in your change; verify with `typecheck` + `build`. Fixing it means pinning `eslint` to `^9`, not changing app code.
- There is no test runner or test directory. Do not invent Jest/Vitest/Playwright commands.

## Stack quirks

- Next.js 16.3.4 App Router + React 19.2.8. Before writing Next-specific code, read the bundled docs under `node_modules/next/dist/docs/`; v16 APIs and conventions differ from older training data.
- Tailwind CSS v4: no `tailwind.config.*`; theme tokens live in `app/globals.css` and are imported via `@import "tailwindcss"`.
- shadcn/ui uses the `base-nova` style on `@base-ui/react`, not Radix. Add components with `npx shadcn@latest add <name>`; config is in `components.json`. Treat `components/ui/*` as generated.
- Use `cn` via `@/lib/utils`; it re-exports the `cn` package. `clsx`/`tailwind-merge` are not installed.
- Path alias `@/*` maps to the project root (`./*`), not a `src/` directory.
- Client components require `"use client"`; most `app/*/page.tsx` files are currently server components.

## Current state

- Auth is wired: teacher e-mail/password via `/signup` + `/login`, and students through Supabase anonymous sign-ins.
- E-mail confirmation is **off** in the Supabase project (built-in mailer is limited to 2 e-mails/hour, no custom SMTP): `signUp` returns a session and `/signup` goes straight to `/painel`. `/auth/confirm` and `/auth/error` are dormant; re-enable confirmation and the no-session branch in `components/signup-form.tsx` together if that ever changes.
- The Supabase schema is in `snake_case` (`professores`, `turmas`, `pastas`, `atividades`, `links`, `estudantes`, `aplicacoes`, `participacoes`, `progresso_estudante`, `atividade_senhas`) with RLS on every table. Migrations live in `supabase/migrations/`; the plan that produced the first ones is `/home/giulio/.opencode/plan/supabase-auth-plan.md`.
- The Supabase project is in **São Paulo (`sa-east-1`)** (`fmhzbhiithwmbjfvblhw`). Apply migrations with `npx supabase db push --db-url <session-pooler-url>`; `supabase/config.toml` is committed for the CLI. The Supabase MCP in this environment points at this project, so `apply_migration`, `execute_sql` and `generate_typescript_types` can be used. Migrations applied via MCP get the current timestamp as version — rename the local file to match the recorded version so `db push` stays in sync.
- Supabase clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (`await cookies()`), `lib/supabase/proxy.ts` + root `proxy.ts` (session refresh, Next 16 proxy convention). Use `getClaims()` on the server, never `getSession()`.
- Authorization helpers are in the `private` schema (`private.current_professor_id()`, `private.professor_owns_*`, `private.estudante_participa_*`, etc.). The ownership helpers are `security definer` and exist to avoid RLS recursion between `atividades`, `aplicacoes`, `participacoes` and `progresso_estudante` — policies must use them instead of joining those tables directly. Student writes go through the `join_activity`, `update_my_progress` and `complete_link` RPCs. Teacher writes go through `set_activity_password` and `move_link` plus direct table updates allowed by RLS. The join code is checked on `/` through `validate_join_code`, granted to `anon`.
- Database types are generated: `lib/supabase/database.types.ts`. Regenerate after schema changes instead of editing by hand — but note the CLI generator (`supabase gen types`) emits a different format than the dashboard generator used for the current file, so prefer the dashboard/MCP generator when it is pointed at the right project.
- Routes: `/` join-code entry, `/aluno` student name entry, `/atividade` student activity view, `/painel` explorador de atividades/pastas (session + professor gate in `app/painel/layout.tsx`), `/painel/pastas/[id]` conteúdo de uma pasta, `/painel/lixeira`, `/painel/atividades/nova`, `/painel/atividades/[id]`, `/login`, `/signup`, `/auth/confirm`, `/auth/error`. `/painel/pastas` redireciona para `/painel`.
- The teacher dashboard is an explorer (`components/painel/explorer/`) with folder tree in `components/app-sidebar.tsx` + `components/nav-projects.tsx`, context menus, drag and drop, and a trash page. `app/painel/actions.ts` holds the CRUD/trash/duplicate server actions; forms use the `ActionForm`/`SubmitButton`/`ConfirmAction` helpers in `components/painel/`.
- Seleção existe só no explorador, compartilhada via `components/painel/selecao-context.tsx` (montado em `app/painel/layout.tsx`); a árvore da sidebar é só navegação e não guarda seleção: um clique seleciona, duplo clique abre, `Ctrl`/`Cmd` alterna, `Shift` seleciona intervalo; selecionar uma pasta inclui as subpastas dela e clicar fora dos itens limpa a seleção. A árvore da sidebar é retrátil (`flattenPastasVisiveis` em `lib/pastas.ts`): um clique expande/recolhe os filhos diretos e abre a pasta no explorador; ao navegar, só o caminho da pasta atual fica aberto (voltar um nível recolhe as subpastas). Acima das pastas raiz há um nó sintético `home` (sem linha no banco), que agrupa todas elas e navega para `/painel`. `Delete` move a seleção para a lixeira numa única leva (`trash_items`). `lib/selecao.ts` tem `itemKey`/`intervalo`/`separarChaves`. Por enquanto a seleção é só visual (nenhuma ação em lote além da lixeira).
- Exclusão é reversível: `pastas` e `atividades` têm `deleted_at` + `trash_id`; excluir uma pasta manda o conteúdo junto para a lixeira. Restauração e exclusão definitiva passam pelas RPCs `restore_trash`, `purge_trash` e `empty_trash`. Duplicação (`duplicate_pasta`, `duplicate_atividade`) copia só conteúdo (links + senha), gera uma nova entrada (código novo) e não copia progresso; a cópia nasce como rascunho.
- Model: an **atividade** is the content (links + password + folder). Cada atividade tem uma única **entrada**: uma linha em `aplicacoes` (com `turma_id = null`) criada automaticamente com a atividade, que guarda o código de entrada e a data de criação. `turmas` continua no schema para uma versão futura, mas nada no app a usa. A student joins with the entry code; the name/nick they type is stored on `participacoes.nome`, so each activity has its own roster. Progress is keyed by `participacao_id` + `link_id`.
- Activity lifecycle: activities start as `rascunho`; publishing requires at least one link and a password (the entry code is created with the activity). The password is bcrypt-hashed in `atividade_senhas` (set via `set_activity_password`) and is shared by all applications of the activity. Encerrar a entrada bloqueia novas entradas e conclusões daquela atividade.
- Student progress: clicking a link marks it `fazendo` via `update_my_progress`; to finish it the student enters the activity password, and `complete_link` marks the current link `concluida`, opens the next one and sets `participacoes.concluido_em` when everything is done. Teachers can override status and set `pontuacao` per participation/link (RLS). `links.ordem` is unique per activity and reordered only through `move_link`.
- Anonymous sign-ins must stay enabled in the Supabase dashboard (Authentication > Sign In / Providers), otherwise `signInAnonymously()` fails with `anonymous_provider_disabled`.
- User-facing copy is Brazilian Portuguese; keep new UI text in pt-BR.
- Progress statuses are `"aberta" | "fazendo" | "concluida" | "bloqueada"` in `components/clickable-card.tsx`. Activity publication statuses are separately `"rascunho" | "publicada" | "arquivada"` on `atividades.status`, and application statuses are `"aberta" | "encerrada"` on `aplicacoes.status`.
- Dark mode is class-based via `next-themes`; pressing `d` outside form fields toggles it (`components/theme-provider.tsx`).

## Conventions

- TypeScript `strict` is enabled.
- Match Prettier output: no semicolons, double quotes, 2-space indent, 80 columns. Run `npm run format` before finishing.
- `.next/`, `next-env.d.ts`, and `*.tsbuildinfo` are generated/ignored; never edit them by hand.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
