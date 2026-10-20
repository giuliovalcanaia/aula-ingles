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

- UI shell only: the app still has no auth wiring or data fetching. Forms are static and have no submit handlers.
- The Supabase project has an empty legacy schema (PascalCase tables) with no RLS policies. The planned auth/schema migration is described in `/home/giulio/.opencode/plan/supabase-auth-plan.md`.
- Routes: `/` activity-code entry, `/aluno` student nickname, `/atividade` activity detail, `/painel` teacher dashboard, `/login`, `/signup`.
- The teacher dashboard is `components/app-sidebar.tsx` plus the `nav-*` components; its data is hardcoded sample data.
- User-facing copy is Brazilian Portuguese; keep new UI text in pt-BR.
- Activity statuses are `"aberta" | "fazendo" | "concluida" | "bloqueada"` in `components/clickable-card.tsx`.
- Dark mode is class-based via `next-themes`; pressing `d` outside form fields toggles it (`components/theme-provider.tsx`).

## Conventions

- TypeScript `strict` is enabled.
- Match Prettier output: no semicolons, double quotes, 2-space indent, 80 columns. Run `npm run format` before finishing.
- `.next/`, `next-env.d.ts`, and `*.tsbuildinfo` are generated/ignored; never edit them by hand.
