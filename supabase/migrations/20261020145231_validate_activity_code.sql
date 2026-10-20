-- ============================================================
-- Validação do código da atividade antes do aluno informar o nome
-- ============================================================
-- O papel `anon` não tem acesso às tabelas do schema `public`, então a
-- checagem do código precisa passar por uma função `security definer`.
create or replace function public.validate_activity_code(p_codigo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.atividades
    where codigo_atividade = upper(trim(p_codigo))
  )
$$;

revoke all on function public.validate_activity_code(text) from public;
grant usage on schema public to anon;
grant execute on function public.validate_activity_code(text) to anon, authenticated;
