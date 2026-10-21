-- ============================================================
-- Entrada única por atividade (sem turma)
-- ============================================================
-- A turma volta numa versão futura. Por enquanto cada atividade tem uma
-- única "entrada" (aplicação), criada junto com a atividade, com a data de
-- criação. Por isso `aplicacoes.turma_id` deixa de ser obrigatório.

alter table public.aplicacoes
  alter column turma_id drop not null;

-- ---------- Geração de código no banco ----------
-- As duplicações acontecem em SQL, então o código de entrada precisa ser
-- gerado aqui também. Mesmo alfabeto do `generateCode` do app.
create or replace function private.generate_application_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_tentativa integer := 0;
begin
  loop
    v_codigo := '';

    for i in 1..6 loop
      v_codigo := v_codigo
        || substr(
          v_alfabeto,
          1 + floor(random() * length(v_alfabeto))::integer,
          1
        );
    end loop;

    exit when not exists (
      select 1 from public.aplicacoes where codigo = v_codigo
    );

    v_tentativa := v_tentativa + 1;

    if v_tentativa >= 20 then
      raise exception 'code_generation_failed';
    end if;
  end loop;

  return v_codigo;
end;
$$;

revoke all on function private.generate_application_code() from public, anon, authenticated;

-- ---------- Duplicação cria a entrada da cópia ----------
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

  insert into public.aplicacoes (atividade_id, turma_id, codigo, data)
  values (
    v_new_id,
    null,
    private.generate_application_code(),
    (now() at time zone 'America/Sao_Paulo')::date
  );

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

    insert into public.aplicacoes (atividade_id, turma_id, codigo, data)
    values (
      v_new_id,
      null,
      private.generate_application_code(),
      (now() at time zone 'America/Sao_Paulo')::date
    );
  end loop;

  return v_new_root_id;
end;
$$;
