-- ============================================================
-- Quebra a recursão entre as políticas de atividades/aplicações
-- ============================================================
-- As políticas que consultam outras tabelas com RLS entravam em loop
-- (atividades -> aplicacoes -> participacoes -> aplicacoes -> ...).
-- As funções abaixo são security definer e consultam as tabelas sem RLS.

create or replace function private.professor_owns_atividade(p_atividade_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.atividades a
    where a.id = p_atividade_id
      and a.professor_id = (select private.current_professor_id())
  )
$$;

create or replace function private.professor_owns_aplicacao(p_aplicacao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.aplicacoes ap
    join public.atividades a on a.id = ap.atividade_id
    where ap.id = p_aplicacao_id
      and a.professor_id = (select private.current_professor_id())
  )
$$;

create or replace function private.professor_owns_participacao(p_participacao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participacoes p
    join public.aplicacoes ap on ap.id = p.aplicacao_id
    join public.atividades a on a.id = ap.atividade_id
    where p.id = p_participacao_id
      and a.professor_id = (select private.current_professor_id())
  )
$$;

create or replace function private.professor_owns_link(p_link_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.links l
    join public.atividades a on a.id = l.atividade_id
    where l.id = p_link_id
      and a.professor_id = (select private.current_professor_id())
  )
$$;

create or replace function private.professor_owns_progresso_link(
  p_participacao_id bigint,
  p_link_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participacoes p
    join public.aplicacoes ap on ap.id = p.aplicacao_id
    join public.atividades a on a.id = ap.atividade_id
    join public.links l on l.atividade_id = a.id
    where p.id = p_participacao_id
      and l.id = p_link_id
      and a.professor_id = (select private.current_professor_id())
  )
$$;

create or replace function private.estudante_participa_atividade(p_atividade_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participacoes p
    join public.aplicacoes ap on ap.id = p.aplicacao_id
    where ap.atividade_id = p_atividade_id
      and p.estudante_id = (select private.current_estudante_id())
  )
$$;

create or replace function private.estudante_participa_aplicacao(p_aplicacao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participacoes p
    where p.aplicacao_id = p_aplicacao_id
      and p.estudante_id = (select private.current_estudante_id())
  )
$$;

create or replace function private.estudante_owns_participacao(p_participacao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participacoes p
    where p.id = p_participacao_id
      and p.estudante_id = (select private.current_estudante_id())
  )
$$;

revoke all on function private.professor_owns_atividade(bigint) from public, anon;
revoke all on function private.professor_owns_aplicacao(bigint) from public, anon;
revoke all on function private.professor_owns_participacao(bigint) from public, anon;
revoke all on function private.professor_owns_link(bigint) from public, anon;
revoke all on function private.professor_owns_progresso_link(bigint, bigint) from public, anon;
revoke all on function private.estudante_participa_atividade(bigint) from public, anon;
revoke all on function private.estudante_participa_aplicacao(bigint) from public, anon;
revoke all on function private.estudante_owns_participacao(bigint) from public, anon;

grant execute on function private.professor_owns_atividade(bigint) to authenticated;
grant execute on function private.professor_owns_aplicacao(bigint) to authenticated;
grant execute on function private.professor_owns_participacao(bigint) to authenticated;
grant execute on function private.professor_owns_link(bigint) to authenticated;
grant execute on function private.professor_owns_progresso_link(bigint, bigint) to authenticated;
grant execute on function private.estudante_participa_atividade(bigint) to authenticated;
grant execute on function private.estudante_participa_aplicacao(bigint) to authenticated;
grant execute on function private.estudante_owns_participacao(bigint) to authenticated;

-- ---------- Atividades ----------
drop policy if exists atividades_student_select on public.atividades;

create policy atividades_student_select
on public.atividades
for select
to authenticated
using (
  status = 'publicada'
  and (select private.estudante_participa_atividade(atividades.id))
);

-- ---------- Aplicações ----------
drop policy if exists aplicacoes_teacher_all on public.aplicacoes;
drop policy if exists aplicacoes_student_select on public.aplicacoes;

create policy aplicacoes_teacher_all
on public.aplicacoes
for all
to authenticated
using ((select private.professor_owns_atividade(aplicacoes.atividade_id)))
with check ((select private.professor_owns_atividade(aplicacoes.atividade_id)));

create policy aplicacoes_student_select
on public.aplicacoes
for select
to authenticated
using ((select private.estudante_participa_aplicacao(aplicacoes.id)));

-- ---------- Participações ----------
drop policy if exists participacoes_teacher_select on public.participacoes;

create policy participacoes_teacher_select
on public.participacoes
for select
to authenticated
using ((select private.professor_owns_aplicacao(participacoes.aplicacao_id)));

-- ---------- Progresso ----------
drop policy if exists progresso_student_select on public.progresso_estudante;
drop policy if exists progresso_teacher_select on public.progresso_estudante;
drop policy if exists progresso_teacher_update on public.progresso_estudante;

create policy progresso_student_select
on public.progresso_estudante
for select
to authenticated
using (
  (select private.estudante_owns_participacao(progresso_estudante.participacao_id))
);

create policy progresso_teacher_select
on public.progresso_estudante
for select
to authenticated
using (
  (select private.professor_owns_participacao(progresso_estudante.participacao_id))
);

create policy progresso_teacher_update
on public.progresso_estudante
for update
to authenticated
using (
  (select private.professor_owns_participacao(progresso_estudante.participacao_id))
)
with check (
  (select private.professor_owns_progresso_link(
    progresso_estudante.participacao_id,
    progresso_estudante.link_id
  ))
);

-- ---------- Links ----------
drop policy if exists links_teacher_all on public.links;
drop policy if exists links_student_select on public.links;

create policy links_teacher_all
on public.links
for all
to authenticated
using ((select private.professor_owns_link(links.id)))
with check (
  (select private.professor_owns_atividade(links.atividade_id))
);

create policy links_student_select
on public.links
for select
to authenticated
using (
  (select private.estudante_participa_atividade(links.atividade_id))
);

-- ---------- Senhas ----------
drop policy if exists atividade_senhas_teacher_select on public.atividade_senhas;

create policy atividade_senhas_teacher_select
on public.atividade_senhas
for select
to authenticated
using (
  (select private.professor_owns_atividade(atividade_senhas.atividade_id))
);
