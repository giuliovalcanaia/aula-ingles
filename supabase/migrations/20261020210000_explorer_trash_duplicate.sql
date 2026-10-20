-- ============================================================
-- Explorador: lixeira (soft delete), restauração e duplicação
-- ============================================================
-- Pastas e atividades passam a ter exclusão reversível. O trash_id
-- agrupa tudo que foi excluído junto (uma pasta leva o conteúdo).
-- Atividades na lixeira deixam de aceitar códigos e de aparecer para
-- os alunos.

-- ---------- 1. Colunas e índices ----------
alter table public.pastas
  add column if not exists deleted_at timestamptz,
  add column if not exists trash_id uuid;

alter table public.atividades
  add column if not exists deleted_at timestamptz,
  add column if not exists trash_id uuid;

create index if not exists pastas_active_parent_id_idx
  on public.pastas (parent_id)
  where deleted_at is null;

create index if not exists pastas_active_professor_id_idx
  on public.pastas (professor_id)
  where deleted_at is null;

create index if not exists atividades_active_pasta_id_idx
  on public.atividades (pasta_id)
  where deleted_at is null;

create index if not exists atividades_active_professor_id_idx
  on public.atividades (professor_id)
  where deleted_at is null;

create index if not exists pastas_trash_id_idx
  on public.pastas (trash_id)
  where trash_id is not null;

create index if not exists atividades_trash_id_idx
  on public.atividades (trash_id)
  where trash_id is not null;

-- ---------- 2. Alunos não enxergam itens na lixeira ----------
-- As funções são security definer para não reabrir a recursão entre
-- atividades, aplicações, participações e progresso.
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
    join public.atividades a on a.id = ap.atividade_id
    where ap.atividade_id = p_atividade_id
      and a.deleted_at is null
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
    join public.aplicacoes ap on ap.id = p.aplicacao_id
    join public.atividades a on a.id = ap.atividade_id
    where p.aplicacao_id = p_aplicacao_id
      and a.deleted_at is null
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
    join public.aplicacoes ap on ap.id = p.aplicacao_id
    join public.atividades a on a.id = ap.atividade_id
    where p.id = p_participacao_id
      and a.deleted_at is null
      and p.estudante_id = (select private.current_estudante_id())
  )
$$;

revoke all on function private.estudante_participa_atividade(bigint) from public, anon;
revoke all on function private.estudante_participa_aplicacao(bigint) from public, anon;
revoke all on function private.estudante_owns_participacao(bigint) from public, anon;

grant execute on function private.estudante_participa_atividade(bigint) to authenticated;
grant execute on function private.estudante_participa_aplicacao(bigint) to authenticated;
grant execute on function private.estudante_owns_participacao(bigint) to authenticated;

drop policy if exists participacoes_student_select on public.participacoes;

create policy participacoes_student_select
on public.participacoes
for select
to authenticated
using (
  (select private.estudante_participa_aplicacao(participacoes.aplicacao_id))
);

-- ---------- 3. Código de entrada e progresso ignoram a lixeira ----------
create or replace function public.validate_join_code(p_codigo text)
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
    where ap.codigo = upper(trim(p_codigo))
      and ap.status = 'aberta'
      and a.status = 'publicada'
      and a.deleted_at is null
  )
$$;

revoke all on function public.validate_join_code(text) from public, anon;
grant execute on function public.validate_join_code(text) to anon, authenticated;

create or replace function public.join_activity(p_codigo text, p_nome text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_aplicacao public.aplicacoes;
  v_atividade public.atividades;
  v_estudante public.estudantes;
  v_participacao public.participacoes;
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
  into v_aplicacao
  from public.aplicacoes
  where codigo = upper(trim(p_codigo));

  if not found then
    raise exception 'invalid_activity_code' using errcode = 'P0002';
  end if;

  select * into v_atividade
  from public.atividades
  where id = v_aplicacao.atividade_id;

  if not found or v_atividade.deleted_at is not null then
    raise exception 'invalid_activity_code' using errcode = 'P0002';
  end if;

  if v_atividade.status <> 'publicada' then
    raise exception 'activity_not_published' using errcode = 'P0001';
  end if;

  if v_aplicacao.status <> 'aberta' then
    raise exception 'application_closed' using errcode = 'P0001';
  end if;

  select * into v_estudante
  from public.estudantes
  where user_id = v_uid;

  if not found then
    insert into public.estudantes (user_id, nome)
    values (v_uid, trim(p_nome))
    returning * into v_estudante;
  else
    update public.estudantes
    set nome = trim(p_nome)
    where id = v_estudante.id
    returning * into v_estudante;
  end if;

  insert into public.participacoes (aplicacao_id, estudante_id, nome)
  values (v_aplicacao.id, v_estudante.id, trim(p_nome))
  on conflict (aplicacao_id, estudante_id) do update
    set nome = excluded.nome
  returning * into v_participacao;

  insert into public.progresso_estudante (participacao_id, link_id, status)
  select
    v_participacao.id,
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
  on conflict (participacao_id, link_id) do nothing;

  return jsonb_build_object(
    'estudante_id', v_estudante.id,
    'participacao_id', v_participacao.id,
    'aplicacao_id', v_aplicacao.id,
    'atividade_id', v_atividade.id
  );
end;
$$;

revoke all on function public.join_activity(text, text) from public, anon;
grant execute on function public.join_activity(text, text) to authenticated;

create or replace function public.update_my_progress(
  p_aplicacao_id bigint,
  p_link_id bigint,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estudante_id bigint := (select private.current_estudante_id());
  v_participacao_id bigint;
  v_progresso_status text;
begin
  if v_estudante_id is null then
    raise exception 'not_a_student' using errcode = '42501';
  end if;

  if p_status <> 'fazendo' then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  select id into v_participacao_id
  from public.participacoes
  where aplicacao_id = p_aplicacao_id
    and estudante_id = v_estudante_id;

  if v_participacao_id is null then
    raise exception 'not_in_application' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.links l
    join public.aplicacoes ap on ap.atividade_id = l.atividade_id
    join public.atividades a on a.id = ap.atividade_id
    where l.id = p_link_id
      and ap.id = p_aplicacao_id
      and a.deleted_at is null
  ) then
    raise exception 'link_not_found' using errcode = 'P0002';
  end if;

  select status into v_progresso_status
  from public.progresso_estudante
  where participacao_id = v_participacao_id
    and link_id = p_link_id;

  if v_progresso_status is null or v_progresso_status not in ('aberta', 'fazendo') then
    raise exception 'link_locked' using errcode = 'P0001';
  end if;

  update public.progresso_estudante
  set status = 'fazendo'
  where participacao_id = v_participacao_id
    and link_id = p_link_id;
end;
$$;

revoke all on function public.update_my_progress(bigint, bigint, text)
  from public, anon;
grant execute on function public.update_my_progress(bigint, bigint, text)
  to authenticated;

create or replace function public.complete_link(
  p_aplicacao_id bigint,
  p_link_id bigint,
  p_senha text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estudante_id bigint := (select private.current_estudante_id());
  v_aplicacao public.aplicacoes;
  v_participacao public.participacoes;
  v_link public.links;
  v_progresso_status text;
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

  select * into v_aplicacao
  from public.aplicacoes
  where id = p_aplicacao_id;

  if not found then
    raise exception 'application_not_found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.atividades
    where id = v_aplicacao.atividade_id
      and deleted_at is null
  ) then
    raise exception 'application_not_found' using errcode = 'P0002';
  end if;

  if v_aplicacao.status <> 'aberta' then
    raise exception 'application_closed' using errcode = 'P0001';
  end if;

  select * into v_participacao
  from public.participacoes
  where aplicacao_id = p_aplicacao_id
    and estudante_id = v_estudante_id;

  if not found then
    raise exception 'not_in_application' using errcode = '42501';
  end if;

  select * into v_link
  from public.links
  where id = p_link_id
    and atividade_id = v_aplicacao.atividade_id;

  if not found then
    raise exception 'link_not_found' using errcode = 'P0002';
  end if;

  select status into v_progresso_status
  from public.progresso_estudante
  where participacao_id = v_participacao.id
    and link_id = p_link_id;

  if v_progresso_status is null or v_progresso_status not in ('aberta', 'fazendo') then
    raise exception 'link_locked' using errcode = 'P0001';
  end if;

  select senha_hash
  into v_senha_hash
  from public.atividade_senhas
  where atividade_id = v_aplicacao.atividade_id;

  if v_senha_hash is null then
    raise exception 'password_not_set' using errcode = 'P0001';
  end if;

  if extensions.crypt(trim(p_senha), v_senha_hash) <> v_senha_hash then
    raise exception 'invalid_password' using errcode = 'P0001';
  end if;

  update public.progresso_estudante
  set status = 'concluida'
  where participacao_id = v_participacao.id
    and link_id = p_link_id;

  select l.id
  into v_next_link_id
  from public.links l
  where l.atividade_id = v_aplicacao.atividade_id
    and l.ordem > v_link.ordem
  order by l.ordem asc
  limit 1;

  if v_next_link_id is not null then
    update public.progresso_estudante
    set status = 'aberta'
    where participacao_id = v_participacao.id
      and link_id = v_next_link_id
      and status = 'bloqueada';
  end if;

  select count(*)
  into v_pending
  from public.progresso_estudante p
  join public.links l on l.id = p.link_id
  where p.participacao_id = v_participacao.id
    and l.atividade_id = v_aplicacao.atividade_id
    and p.status <> 'concluida';

  if v_pending = 0 then
    update public.participacoes
    set concluido_em = coalesce(concluido_em, now())
    where id = v_participacao.id;
  end if;

  return jsonb_build_object(
    'link_id', p_link_id,
    'next_link_id', v_next_link_id
  );
end;
$$;

revoke all on function public.complete_link(bigint, bigint, text)
  from public, anon;
grant execute on function public.complete_link(bigint, bigint, text)
  to authenticated;

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
      and deleted_at is null
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

-- ---------- 4. Lixeira ----------
create or replace function public.trash_pasta(p_pasta_id bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
  v_trash_id uuid := gen_random_uuid();
  v_now timestamptz := now();
  v_folder_ids bigint[] := '{}';
begin
  if v_professor_id is null then
    raise exception 'not_a_professor' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.pastas
    where id = p_pasta_id
      and professor_id = v_professor_id
      and deleted_at is null
  ) then
    raise exception 'folder_not_found' using errcode = 'P0002';
  end if;

  with recursive subtree as (
    select p.id
    from public.pastas p
    where p.id = p_pasta_id
      and p.professor_id = v_professor_id
      and p.deleted_at is null
    union
    select child.id
    from public.pastas child
    join subtree parent on parent.id = child.parent_id
    where child.professor_id = v_professor_id
      and child.deleted_at is null
  )
  select coalesce(array_agg(id), '{}'::bigint[])
  into v_folder_ids
  from subtree;

  update public.pastas
  set deleted_at = v_now,
      trash_id = v_trash_id
  where id = any(v_folder_ids);

  update public.atividades
  set deleted_at = v_now,
      trash_id = v_trash_id
  where professor_id = v_professor_id
    and deleted_at is null
    and pasta_id = any(v_folder_ids);

  return v_trash_id;
end;
$$;

create or replace function public.trash_atividade(p_atividade_id bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
  v_trash_id uuid := gen_random_uuid();
begin
  if v_professor_id is null then
    raise exception 'not_a_professor' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.atividades
    where id = p_atividade_id
      and professor_id = v_professor_id
      and deleted_at is null
  ) then
    raise exception 'activity_not_found' using errcode = 'P0002';
  end if;

  update public.atividades
  set deleted_at = now(),
      trash_id = v_trash_id
  where id = p_atividade_id
    and professor_id = v_professor_id;

  return v_trash_id;
end;
$$;

create or replace function public.restore_trash(p_trash_id uuid)
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

  if not exists (
    select 1 from public.pastas
    where trash_id = p_trash_id and professor_id = v_professor_id
  ) and not exists (
    select 1 from public.atividades
    where trash_id = p_trash_id and professor_id = v_professor_id
  ) then
    raise exception 'trash_item_not_found' using errcode = 'P0002';
  end if;

  update public.pastas p
  set deleted_at = null,
      trash_id = null,
      parent_id = case
        when p.parent_id is null then null
        when exists (
          select 1 from public.pastas parent
          where parent.id = p.parent_id
            and parent.trash_id = p_trash_id
        ) then p.parent_id
        when exists (
          select 1 from public.pastas parent
          where parent.id = p.parent_id
            and parent.deleted_at is null
        ) then p.parent_id
        else null
      end
  where p.trash_id = p_trash_id
    and p.professor_id = v_professor_id;

  update public.atividades a
  set deleted_at = null,
      trash_id = null,
      pasta_id = case
        when a.pasta_id is null then null
        when exists (
          select 1 from public.pastas p
          where p.id = a.pasta_id
            and p.deleted_at is null
        ) then a.pasta_id
        else null
      end
  where a.trash_id = p_trash_id
    and a.professor_id = v_professor_id;
end;
$$;

create or replace function public.purge_trash(p_trash_id uuid)
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

  if not exists (
    select 1 from public.pastas
    where trash_id = p_trash_id and professor_id = v_professor_id
  ) and not exists (
    select 1 from public.atividades
    where trash_id = p_trash_id and professor_id = v_professor_id
  ) then
    raise exception 'trash_item_not_found' using errcode = 'P0002';
  end if;

  -- Atividades primeiro: leva junto links, turmas, nomes e progresso.
  delete from public.atividades
  where trash_id = p_trash_id
    and professor_id = v_professor_id;

  -- Subpastas ativas ou de outra leva não podem ser apagadas em cascata.
  update public.pastas child
  set parent_id = null
  where child.professor_id = v_professor_id
    and child.trash_id is distinct from p_trash_id
    and child.parent_id in (
      select p.id from public.pastas p
      where p.trash_id = p_trash_id
        and p.professor_id = v_professor_id
    );

  delete from public.pastas
  where trash_id = p_trash_id
    and professor_id = v_professor_id;
end;
$$;

create or replace function public.empty_trash()
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

  delete from public.atividades
  where professor_id = v_professor_id
    and deleted_at is not null;

  update public.pastas child
  set parent_id = null
  where child.professor_id = v_professor_id
    and child.deleted_at is null
    and child.parent_id in (
      select p.id from public.pastas p
      where p.professor_id = v_professor_id
        and p.deleted_at is not null
    );

  delete from public.pastas
  where professor_id = v_professor_id
    and deleted_at is not null;
end;
$$;

revoke all on function public.trash_pasta(bigint) from public, anon;
revoke all on function public.trash_atividade(bigint) from public, anon;
revoke all on function public.restore_trash(uuid) from public, anon;
revoke all on function public.purge_trash(uuid) from public, anon;
revoke all on function public.empty_trash() from public, anon;

grant execute on function public.trash_pasta(bigint) to authenticated;
grant execute on function public.trash_atividade(bigint) to authenticated;
grant execute on function public.restore_trash(uuid) to authenticated;
grant execute on function public.purge_trash(uuid) to authenticated;
grant execute on function public.empty_trash() to authenticated;

-- ---------- 5. Duplicação (somente conteúdo) ----------
create or replace function public.duplicate_atividade(p_atividade_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
  v_source public.atividades;
  v_pasta_id bigint;
  v_new_id bigint;
begin
  if v_professor_id is null then
    raise exception 'not_a_professor' using errcode = '42501';
  end if;

  select * into v_source
  from public.atividades
  where id = p_atividade_id
    and professor_id = v_professor_id
    and deleted_at is null;

  if not found then
    raise exception 'activity_not_found' using errcode = 'P0002';
  end if;

  select case
    when v_source.pasta_id is null then null
    when exists (
      select 1 from public.pastas p
      where p.id = v_source.pasta_id
        and p.deleted_at is null
    ) then v_source.pasta_id
    else null
  end
  into v_pasta_id;

  insert into public.atividades (
    professor_id,
    pasta_id,
    titulo,
    subtitulo,
    status,
    publicada_em
  )
  values (
    v_professor_id,
    v_pasta_id,
    v_source.titulo || ' (cópia)',
    v_source.subtitulo,
    'rascunho',
    null
  )
  returning id into v_new_id;

  insert into public.links (atividade_id, ordem, titulo, descricao, href)
  select v_new_id, l.ordem, l.titulo, l.descricao, l.href
  from public.links l
  where l.atividade_id = v_source.id;

  insert into public.atividade_senhas (atividade_id, senha_hash)
  select v_new_id, s.senha_hash
  from public.atividade_senhas s
  where s.atividade_id = v_source.id;

  return v_new_id;
end;
$$;

create or replace function public.duplicate_pasta(p_pasta_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
  v_source public.pastas;
  v_new_root_id bigint;
  v_new_id bigint;
  v_inserted integer;
  v_row record;
begin
  if v_professor_id is null then
    raise exception 'not_a_professor' using errcode = '42501';
  end if;

  select * into v_source
  from public.pastas
  where id = p_pasta_id
    and professor_id = v_professor_id
    and deleted_at is null;

  if not found then
    raise exception 'folder_not_found' using errcode = 'P0002';
  end if;

  create temp table if not exists _pasta_map (
    old_id bigint primary key,
    new_id bigint not null
  ) on commit drop;

  truncate _pasta_map;

  insert into public.pastas (professor_id, parent_id, nome)
  values (
    v_professor_id,
    case
      when v_source.parent_id is null then null
      when exists (
        select 1 from public.pastas p
        where p.id = v_source.parent_id
          and p.deleted_at is null
      ) then v_source.parent_id
      else null
    end,
    v_source.nome || ' (cópia)'
  )
  returning id into v_new_root_id;

  insert into _pasta_map (old_id, new_id)
  values (p_pasta_id, v_new_root_id);

  loop
    v_inserted := 0;

    for v_row in
      select
        p.id,
        p.professor_id,
        p.nome,
        m.new_id as new_parent_id
      from public.pastas p
      join _pasta_map m on m.old_id = p.parent_id
      where p.professor_id = v_professor_id
        and p.deleted_at is null
        and not exists (
          select 1 from _pasta_map x where x.old_id = p.id
        )
      order by p.id
    loop
      insert into public.pastas (professor_id, parent_id, nome)
      values (v_row.professor_id, v_row.new_parent_id, v_row.nome)
      returning id into v_new_id;

      insert into _pasta_map (old_id, new_id)
      values (v_row.id, v_new_id);

      v_inserted := v_inserted + 1;
    end loop;

    exit when v_inserted = 0;
  end loop;

  for v_row in
    select
      a.id,
      a.titulo,
      a.subtitulo,
      m.new_id as new_pasta_id
    from public.atividades a
    join _pasta_map m on m.old_id = a.pasta_id
    where a.professor_id = v_professor_id
      and a.deleted_at is null
  loop
    insert into public.atividades (
      professor_id,
      pasta_id,
      titulo,
      subtitulo,
      status,
      publicada_em
    )
    values (
      v_professor_id,
      v_row.new_pasta_id,
      v_row.titulo || ' (cópia)',
      v_row.subtitulo,
      'rascunho',
      null
    )
    returning id into v_new_id;

    insert into public.links (atividade_id, ordem, titulo, descricao, href)
    select v_new_id, l.ordem, l.titulo, l.descricao, l.href
    from public.links l
    where l.atividade_id = v_row.id;

    insert into public.atividade_senhas (atividade_id, senha_hash)
    select v_new_id, s.senha_hash
    from public.atividade_senhas s
    where s.atividade_id = v_row.id;
  end loop;

  return v_new_root_id;
end;
$$;

revoke all on function public.duplicate_atividade(bigint) from public, anon;
revoke all on function public.duplicate_pasta(bigint) from public, anon;

grant execute on function public.duplicate_atividade(bigint) to authenticated;
grant execute on function public.duplicate_pasta(bigint) to authenticated;
