-- Ajuste manual do progresso pelo professor. Ao marcar um link como
-- concluído, a próxima etapa bloqueada é aberta, como em `complete_link`.
create or replace function public.set_student_progress(
  p_participacao_id bigint,
  p_link_id bigint,
  p_status text,
  p_pontuacao integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professor_id bigint := (select private.current_professor_id());
  v_atividade_id bigint;
  v_link_ordem integer;
  v_next_link_id bigint;
begin
  if v_professor_id is null then
    raise exception 'not_a_professor' using errcode = '42501';
  end if;

  if p_status not in ('aberta', 'fazendo', 'concluida', 'bloqueada') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  select l.atividade_id, l.ordem
  into v_atividade_id, v_link_ordem
  from public.links l
  join public.aplicacoes ap on ap.atividade_id = l.atividade_id
  join public.participacoes p on p.aplicacao_id = ap.id
  join public.atividades a on a.id = l.atividade_id
  where l.id = p_link_id
    and p.id = p_participacao_id
    and a.professor_id = v_professor_id
    and a.deleted_at is null;

  if v_atividade_id is null then
    raise exception 'progress_not_found' using errcode = 'P0002';
  end if;

  update public.progresso_estudante
  set status = p_status,
      pontuacao = p_pontuacao
  where participacao_id = p_participacao_id
    and link_id = p_link_id;

  if p_status = 'concluida' then
    select l.id
    into v_next_link_id
    from public.links l
    where l.atividade_id = v_atividade_id
      and l.ordem > v_link_ordem
    order by l.ordem asc
    limit 1;

    if v_next_link_id is not null then
      update public.progresso_estudante
      set status = 'aberta'
      where participacao_id = p_participacao_id
        and link_id = v_next_link_id
        and status = 'bloqueada';
    end if;
  end if;
end;
$$;

revoke all on function public.set_student_progress(bigint, bigint, text, integer)
  from public, anon;
grant execute on function public.set_student_progress(bigint, bigint, text, integer)
  to authenticated;
