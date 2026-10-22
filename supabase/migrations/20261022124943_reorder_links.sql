-- Reordena todos os links de uma atividade de uma vez (usado pelo arrastar).
-- A troca em duas fases evita violar unique (atividade_id, ordem).
create or replace function public.reorder_links(
  p_atividade_id bigint,
  p_link_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
  v_total integer;
  v_validos integer;
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

  select count(*)
  into v_total
  from public.links
  where atividade_id = p_atividade_id;

  select count(distinct l.id)
  into v_validos
  from public.links l
  join unnest(p_link_ids) as t(id) on t.id = l.id
  where l.atividade_id = p_atividade_id;

  if v_total = 0
    or v_total <> coalesce(array_length(p_link_ids, 1), 0)
    or v_validos <> v_total then
    raise exception 'invalid_link_set' using errcode = '22023';
  end if;

  update public.links
  set ordem = -id
  where atividade_id = p_atividade_id;

  update public.links l
  set ordem = t.ord
  from unnest(p_link_ids) with ordinality as t(id, ord)
  where l.id = t.id
    and l.atividade_id = p_atividade_id;
end;
$$;

revoke all on function public.reorder_links(bigint, bigint[]) from public, anon;
grant execute on function public.reorder_links(bigint, bigint[]) to authenticated;
