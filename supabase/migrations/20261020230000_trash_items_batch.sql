-- ============================================================
-- Lixeira em lote
-- ============================================================
-- Move várias pastas/atividades para a lixeira em uma única leva,
-- compartilhando o mesmo trash_id para o "Desfazer" restaurar tudo.
-- A subárvore das pastas selecionadas e as atividades dentro delas
-- entram junto, como em trash_pasta.

create or replace function public.trash_items(
  p_pastas bigint[] default '{}',
  p_atividades bigint[] default '{}'
)
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

  if exists (
    select 1
    from unnest(coalesce(p_pastas, '{}'::bigint[])) as item(id)
    where not exists (
      select 1
      from public.pastas p
      where p.id = item.id
        and p.professor_id = v_professor_id
        and p.deleted_at is null
    )
  ) then
    raise exception 'folder_not_found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_atividades, '{}'::bigint[])) as item(id)
    where not exists (
      select 1
      from public.atividades a
      where a.id = item.id
        and a.professor_id = v_professor_id
        and a.deleted_at is null
    )
  ) then
    raise exception 'activity_not_found' using errcode = 'P0002';
  end if;

  with recursive subtree as (
    select p.id
    from public.pastas p
    where p.id = any(coalesce(p_pastas, '{}'::bigint[]))
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
    and (
      pasta_id = any(v_folder_ids)
      or id = any(coalesce(p_atividades, '{}'::bigint[]))
    );

  return v_trash_id;
end;
$$;

revoke all on function public.trash_items(bigint[], bigint[]) from public, anon;
grant execute on function public.trash_items(bigint[], bigint[]) to authenticated;
