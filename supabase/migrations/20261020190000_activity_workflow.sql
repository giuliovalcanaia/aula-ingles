-- ============================================================
-- Fluxo de atividades: status, senha de liberação e tempos
-- ============================================================

-- 1. Status, publicação e data da atividade
alter table public.atividades
  add column status text not null default 'rascunho'
    check (status in ('rascunho', 'publicada', 'arquivada')),
  add column publicada_em timestamptz,
  add column data_realizacao date;

create index atividades_status_idx on public.atividades (status);
create index atividades_data_realizacao_idx on public.atividades (data_realizacao);

-- Colunas antigas de data/horário, substituídas por atividades.data_realizacao
-- e pela tabela estudante_atividade.
alter table public.turmas drop column if exists data_realizacao_atividade;
alter table public.estudantes
  drop column if exists horario_inicio_atividade,
  drop column if exists horario_termino_atividade;

-- ============================================================
-- 2. Senha de liberação (uma por atividade)
-- ============================================================
-- Fica em tabela separada para o hash nunca ser lido pelo aluno. Escritas
-- acontecem apenas pela função security definer set_activity_password.
create table public.atividade_senhas (
  atividade_id bigint primary key
    references public.atividades(id) on delete cascade,
  senha_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger atividade_senhas_set_updated_at
before update on public.atividade_senhas
for each row execute function public.set_updated_at();

alter table public.atividade_senhas enable row level security;

create policy atividade_senhas_teacher_select
on public.atividade_senhas
for select
to authenticated
using (
  exists (
    select 1
    from public.atividades a
    join public.turmas t on t.id = a.turma_id
    where a.id = atividade_senhas.atividade_id
      and t.professor_id = (select private.current_professor_id())
  )
);

revoke all on public.atividade_senhas from anon;
grant select on public.atividade_senhas to authenticated;

create or replace function public.set_activity_password(
  p_atividade_id bigint,
  p_senha text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
begin
  if v_professor_id is null then
    raise exception 'not_a_professor' using errcode = '42501';
  end if;

  if nullif(trim(p_senha), '') is null then
    raise exception 'password_required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.atividades
    where id = p_atividade_id
      and professor_id = v_professor_id
  ) then
    raise exception 'activity_not_found' using errcode = 'P0002';
  end if;

  insert into public.atividade_senhas (atividade_id, senha_hash)
  values (
    p_atividade_id,
    extensions.crypt(trim(p_senha), extensions.gen_salt('bf'))
  )
  on conflict (atividade_id) do update
    set senha_hash = excluded.senha_hash,
        updated_at = now();
end;
$$;

revoke all on function public.set_activity_password(bigint, text) from public, anon;
grant execute on function public.set_activity_password(bigint, text) to authenticated;

-- ============================================================
-- 3. Tempos por aluno x atividade
-- ============================================================
create table public.estudante_atividade (
  estudante_id bigint not null references public.estudantes(id) on delete cascade,
  atividade_id bigint not null references public.atividades(id) on delete cascade,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  primary key (estudante_id, atividade_id)
);

create index estudante_atividade_atividade_id_idx
  on public.estudante_atividade (atividade_id);

alter table public.estudante_atividade enable row level security;

create policy estudante_atividade_student_select
on public.estudante_atividade
for select
to authenticated
using (estudante_id = (select private.current_estudante_id()));

create policy estudante_atividade_teacher_select
on public.estudante_atividade
for select
to authenticated
using (
  exists (
    select 1
    from public.atividades a
    join public.turmas t on t.id = a.turma_id
    where a.id = estudante_atividade.atividade_id
      and t.professor_id = (select private.current_professor_id())
  )
);

revoke all on public.estudante_atividade from anon;
grant select on public.estudante_atividade to authenticated;

-- ============================================================
-- 4. Validação do código só aceita atividade publicada
-- ============================================================
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
      and status = 'publicada'
  )
$$;

revoke all on function public.validate_activity_code(text) from public;
grant usage on schema public to anon;
grant execute on function public.validate_activity_code(text) to anon, authenticated;

-- ============================================================
-- 5. Entrada do aluno: exige publicação e registra o início
-- ============================================================
create or replace function public.join_activity(p_codigo text, p_nome text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_atividade public.atividades;
  v_estudante public.estudantes;
  v_codigo_aluno text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if nullif(trim(p_nome), '') is null then
    raise exception 'name_required' using errcode = '22023';
  end if;

  if exists (select 1 from public.professores where user_id = v_uid) then
    raise exception 'teacher_cannot_join_as_student' using errcode = '42501';
  end if;

  select *
  into v_atividade
  from public.atividades
  where codigo_atividade = upper(trim(p_codigo));

  if not found then
    raise exception 'invalid_activity_code' using errcode = 'P0002';
  end if;

  if v_atividade.status <> 'publicada' then
    raise exception 'activity_not_published' using errcode = 'P0001';
  end if;

  select *
  into v_estudante
  from public.estudantes
  where user_id = v_uid;

  if found then
    if v_estudante.turma_id <> v_atividade.turma_id then
      raise exception 'student_already_in_another_class' using errcode = 'P0001';
    end if;

    update public.estudantes
    set nome = trim(p_nome)
    where id = v_estudante.id
    returning * into v_estudante;
  else
    loop
      v_codigo_aluno := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
      exit when not exists (
        select 1
        from public.estudantes
        where turma_id = v_atividade.turma_id
          and codigo_aluno = v_codigo_aluno
      );
    end loop;

    insert into public.estudantes (user_id, turma_id, nome, codigo_aluno)
    values (v_uid, v_atividade.turma_id, trim(p_nome), v_codigo_aluno)
    returning * into v_estudante;
  end if;

  insert into public.estudante_atividade (estudante_id, atividade_id)
  values (v_estudante.id, v_atividade.id)
  on conflict (estudante_id, atividade_id) do nothing;

  insert into public.progresso_estudante (estudante_id, link_id, status)
  select
    v_estudante.id,
    l.id,
    case
      when l.ordem = (
        select min(l2.ordem)
        from public.links l2
        where l2.atividade_id = v_atividade.id
      ) then 'aberta'
      else 'bloqueada'
    end
  from public.links l
  where l.atividade_id = v_atividade.id
  on conflict (estudante_id, link_id) do nothing;

  return jsonb_build_object(
    'estudante_id', v_estudante.id,
    'turma_id', v_atividade.turma_id,
    'atividade_id', v_atividade.id
  );
end;
$$;

revoke all on function public.join_activity(text, text) from public, anon;
grant execute on function public.join_activity(text, text) to authenticated;

-- ============================================================
-- 6. Conclusão de um link com a senha da atividade
-- ============================================================
create or replace function public.complete_link(p_link_id bigint, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estudante_id bigint := (select private.current_estudante_id());
  v_estudante public.estudantes;
  v_link public.links;
  v_atividade public.atividades;
  v_progresso public.progresso_estudante;
  v_senha_hash text;
  v_next_link_id bigint;
  v_pending integer;
begin
  if v_estudante_id is null then
    raise exception 'not_a_student' using errcode = '42501';
  end if;

  if nullif(trim(p_senha), '') is null then
    raise exception 'password_required' using errcode = '22023';
  end if;

  select * into v_link from public.links where id = p_link_id;

  if not found then
    raise exception 'link_not_found' using errcode = 'P0002';
  end if;

  select * into v_atividade
  from public.atividades
  where id = v_link.atividade_id;

  select * into v_estudante
  from public.estudantes
  where id = v_estudante_id;

  if v_estudante.turma_id <> v_atividade.turma_id then
    raise exception 'student_not_in_class' using errcode = '42501';
  end if;

  select * into v_progresso
  from public.progresso_estudante
  where estudante_id = v_estudante_id
    and link_id = p_link_id;

  if not found or v_progresso.status not in ('aberta', 'fazendo') then
    raise exception 'link_locked' using errcode = 'P0001';
  end if;

  select senha_hash
  into v_senha_hash
  from public.atividade_senhas
  where atividade_id = v_atividade.id;

  if v_senha_hash is null then
    raise exception 'password_not_set' using errcode = 'P0001';
  end if;

  if extensions.crypt(trim(p_senha), v_senha_hash) <> v_senha_hash then
    raise exception 'invalid_password' using errcode = 'P0001';
  end if;

  update public.progresso_estudante
  set status = 'concluida'
  where estudante_id = v_estudante_id
    and link_id = p_link_id;

  select l.id
  into v_next_link_id
  from public.links l
  where l.atividade_id = v_atividade.id
    and l.ordem > v_link.ordem
  order by l.ordem asc
  limit 1;

  if v_next_link_id is not null then
    update public.progresso_estudante
    set status = 'aberta'
    where estudante_id = v_estudante_id
      and link_id = v_next_link_id
      and status = 'bloqueada';
  end if;

  select count(*)
  into v_pending
  from public.progresso_estudante p
  join public.links l on l.id = p.link_id
  where p.estudante_id = v_estudante_id
    and l.atividade_id = v_atividade.id
    and p.status <> 'concluida';

  if v_pending = 0 then
    update public.estudante_atividade
    set concluido_em = coalesce(concluido_em, now())
    where estudante_id = v_estudante_id
      and atividade_id = v_atividade.id;
  end if;

  return jsonb_build_object(
    'link_id', p_link_id,
    'next_link_id', v_next_link_id
  );
end;
$$;

revoke all on function public.complete_link(bigint, text) from public, anon;
grant execute on function public.complete_link(bigint, text) to authenticated;

-- ============================================================
-- 7. Reordenação de links
-- ============================================================
create or replace function public.move_link(p_link_id bigint, p_direcao integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
  v_link public.links;
  v_other public.links;
begin
  if v_professor_id is null then
    raise exception 'not_a_professor' using errcode = '42501';
  end if;

  if p_direcao not in (-1, 1) then
    raise exception 'invalid_direction' using errcode = '22023';
  end if;

  select * into v_link from public.links where id = p_link_id;

  if not found then
    raise exception 'link_not_found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.atividades
    where id = v_link.atividade_id
      and professor_id = v_professor_id
  ) then
    raise exception 'activity_not_found' using errcode = 'P0002';
  end if;

  select *
  into v_other
  from public.links
  where atividade_id = v_link.atividade_id
    and ordem = v_link.ordem + p_direcao;

  if not found then
    return;
  end if;

  -- Troca em três passos para não violar unique (atividade_id, ordem).
  update public.links set ordem = -1 where id = v_link.id;
  update public.links set ordem = v_link.ordem where id = v_other.id;
  update public.links set ordem = v_other.ordem where id = v_link.id;
end;
$$;

revoke all on function public.move_link(bigint, integer) from public, anon;
grant execute on function public.move_link(bigint, integer) to authenticated;
