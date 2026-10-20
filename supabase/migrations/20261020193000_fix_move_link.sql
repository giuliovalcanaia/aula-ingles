-- Permite reordenar mesmo com lacunas em links.ordem (ex.: após excluir um link).
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

  if p_direcao = -1 then
    select *
    into v_other
    from public.links
    where atividade_id = v_link.atividade_id
      and ordem < v_link.ordem
    order by ordem desc
    limit 1;
  else
    select *
    into v_other
    from public.links
    where atividade_id = v_link.atividade_id
      and ordem > v_link.ordem
    order by ordem asc
    limit 1;
  end if;

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
