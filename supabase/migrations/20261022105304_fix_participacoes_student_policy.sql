-- ============================================================
-- Aluno só enxerga a própria participação
-- ============================================================
-- A policy criada em explorer_trash_duplicate liberava, para qualquer aluno
-- inscrito na aplicação, todas as participações dela (a lista de nomes
-- inteira). Além do vazamento, isso quebrava a página da atividade: ela lê a
-- própria participação com maybeSingle() e, vendo mais de uma linha, recebia
-- erro do PostgREST (data = null) e devolvia o aluno para a tela do nome.
--
-- A participação pertence ao aluno: o filtro tem de ser pelo estudante atual.

alter table public.participacoes enable row level security;

drop policy if exists participacoes_student_select on public.participacoes;

create policy participacoes_student_select
on public.participacoes
for select
to authenticated
using (estudante_id = (select private.current_estudante_id()));
