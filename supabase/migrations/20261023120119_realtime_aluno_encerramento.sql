-- Permite que a tela do aluno reaja em tempo real ao encerramento/reabertura
-- da atividade. A entrada (aplicacoes) continua visível para o aluno mesmo
-- encerrada, então o evento UPDATE passa pela RLS; já a atividade fechada
-- deixa de ser visível pela policy de atividades e não serviria como gatilho.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'aplicacoes'
  ) then
    execute 'alter publication supabase_realtime add table public.aplicacoes';
  end if;
end
$$;
