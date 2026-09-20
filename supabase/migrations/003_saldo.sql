-- =============================================================
-- 003_saldo.sql - saldo de aulas por aluno (parte 2 do plano)
-- Aplique no Supabase: SQL Editor > colar > Run.
-- PODE RODAR QUANTAS VEZES PRECISAR (sempre com if not exists).
-- =============================================================

-- 1) Colunas de saldo no agendamento ---------------------------
-- consumiu_aula: true quando o agendamento usa 1 aula de um pacote.
-- compra_id:      qual compra foi descontada (para devolver no cancelar).
alter table public.agendamentos
  add column if not exists consumiu_aula boolean not null default false,
  add column if not exists compra_id uuid references public.compras (id) on delete set null;

create index if not exists agendamentos_compra_idx on public.agendamentos (compra_id);

-- 2) Função que devolve a aula de volta ao pacote ---------------
create or replace function public.devolver_aula(compra_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.compras
  set qtd_aulas_restantes = qtd_aulas_restantes + 1
  where id = compra_id;
end;
$$;
