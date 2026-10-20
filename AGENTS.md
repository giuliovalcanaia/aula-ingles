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
- The Supabase schema is in `snake_case` (`professores`, `turmas`, `pastas`, `atividades`, `links`, `estudantes`, `progresso_estudante`) with RLS on every table. Migrations live in `supabase/migrations/`; the plan that produced them is `/home/giulio/.opencode/plan/supabase-auth-plan.md`.
- Supabase clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (`await cookies()`), `lib/supabase/proxy.ts` + root `proxy.ts` (session refresh, Next 16 proxy convention). Use `getClaims()` on the server, never `getSession()`.
- Authorization helpers are in the `private` schema (`private.current_professor_id()`, etc.) and are used by the RLS policies. Student writes go through the `join_activity` and `update_my_progress` RPCs.
- Database types are generated: `lib/supabase/database.types.ts`. Regenerate after schema changes instead of editing by hand.
- Routes: `/` activity-code entry, `/aluno` student name entry, `/atividade` student activity view, `/painel` teacher dashboard (session + professor gate in `app/painel/layout.tsx`), `/login`, `/signup`, `/auth/confirm`, `/auth/error`.
- The teacher dashboard is `components/app-sidebar.tsx` plus the `nav-*` components. `/painel` lists real activities; navigation items are still placeholders and there is no create/edit UI yet.
- Student progress status is only changed by the teacher (direct update, allowed by RLS); the student can only mark a link as `fazendo` via `update_my_progress`.
- Anonymous sign-ins must stay enabled in the Supabase dashboard (Authentication > Sign In / Providers), otherwise `signInAnonymously()` fails with `anonymous_provider_disabled`.
- User-facing copy is Brazilian Portuguese; keep new UI text in pt-BR.
- Activity statuses are `"aberta" | "fazendo" | "concluida" | "bloqueada"` in `components/clickable-card.tsx`.
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
