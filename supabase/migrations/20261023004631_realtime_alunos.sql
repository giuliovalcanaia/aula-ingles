-- Habilita o acompanhamento em tempo real dos alunos no painel do professor:
-- a lista de nomes (participacoes) e o progresso/conclusao (progresso_estudante).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'participacoes'
  ) then
    execute 'alter publication supabase_realtime add table public.participacoes';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'progresso_estudante'
  ) then
    execute 'alter publication supabase_realtime add table public.progresso_estudante';
  end if;
end
$$;
