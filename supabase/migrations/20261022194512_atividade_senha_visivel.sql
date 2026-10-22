-- Exibe a senha de liberação para o professor dono da atividade.
--
-- A senha continua sendo validada pelo hash bcrypt em `senha_hash`. A coluna
-- `senha_texto` guarda uma cópia legível apenas para consulta do professor;
-- a policy de `atividade_senhas` já restringe a leitura ao dono da atividade.
-- Atividades criadas antes desta migration ficam com `senha_texto = null` e
-- precisam definir uma nova senha para que ela apareça na interface.

alter table public.atividade_senhas
  add column senha_texto text;

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

  insert into public.atividade_senhas (atividade_id, senha_hash, senha_texto)
  values (
    p_atividade_id,
    extensions.crypt(trim(p_senha), extensions.gen_salt('bf')),
    trim(p_senha)
  )
  on conflict (atividade_id) do update
    set senha_hash = excluded.senha_hash,
        senha_texto = excluded.senha_texto,
        updated_at = now();
end;
$$;

revoke all on function public.set_activity_password(bigint, text) from public, anon;
grant execute on function public.set_activity_password(bigint, text) to authenticated;

