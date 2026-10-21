-- ============================================================
-- Expiração do login do professor (24h)
-- ============================================================
-- Devolve o início da sessão do próprio chamador, lido de
-- auth.sessions. O proxy usa esse valor para forçar um novo login
-- quando a sessão do professor passa de 24 horas.
--
-- Só expõe a sessão do próprio usuário: o filtro por user_id impede
-- que alguém leia o início de sessão de outra pessoa.

create or replace function public.session_started_at()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select s.created_at
  from auth.sessions s
  where s.id = (auth.jwt() ->> 'session_id')::uuid
    and s.user_id = (select auth.uid())
$$;

revoke all on function public.session_started_at() from public, anon;
grant execute on function public.session_started_at() to authenticated;
