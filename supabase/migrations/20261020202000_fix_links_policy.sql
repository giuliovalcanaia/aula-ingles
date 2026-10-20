-- A política de links não pode depender da própria linha recém-inserida
-- (o RETURNING avalia a política USING antes da linha ser visível à função).
drop policy if exists links_teacher_all on public.links;

create policy links_teacher_all
on public.links
for all
to authenticated
using ((select private.professor_owns_atividade(links.atividade_id)))
with check ((select private.professor_owns_atividade(links.atividade_id)));
