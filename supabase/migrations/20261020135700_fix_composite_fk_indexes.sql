-- FKs compostas (turma_id, professor_id) e (parent_id, professor_id)
-- precisam de índices que cubram a combinação completa.
drop index if exists public.atividades_turma_id_idx;
create index atividades_turma_id_professor_id_idx
  on public.atividades (turma_id, professor_id);

drop index if exists public.pastas_parent_id_idx;
create index pastas_parent_id_professor_id_idx
  on public.pastas (parent_id, professor_id);
