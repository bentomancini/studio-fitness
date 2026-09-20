-- =============================================================
-- 002_dono.sql - Acesso restrito SOMENTE ao dono + colunas de saldo
-- Aplique no Supabase: SQL Editor > New query > colar > Run.
-- Troque o e-mail abaixo pelo e-mail da SUA conta (bentomancini@gmail.com).
-- =============================================================

-- 1) Tabela de configuração (uma linha por chave) --------------
create table if not exists public.config (
  chave text primary key,
  valor text not null
);
insert into public.config (chave, valor)
values ('dono_email', 'bentomancini@gmail.com')
on conflict (chave) do update set valor = excluded.valor;

-- 2) Função que devolve o UUID do dono -------------------------
-- Todas as políticas usam esta função: auth.uid() = public.dono_id().
-- Para trocar de dono no futuro, basta editar config.dono_email.
create or replace function public.dono_id()
returns uuid
language sql
stable
security invoker
as $$
  select id
  from auth.users
  where lower(email) = lower((select valor from public.config where chave = 'dono_email'))
  limit 1
$$;

-- 3) Habilita RLS na configuração e protege contra o dono ------
alter table public.config enable row level security;

drop policy if exists "config - somente dono" on public.config;
create policy "config - somente dono"
  on public.config for all
  to authenticated
  using (auth.uid() = public.dono_id())
  with check (auth.uid() = public.dono_id());

-- 4) Recome campo de saldo no agendamento ----------------------
-- Cada agendamento guarda SE consumiu uma aula de um pacote e de
-- qual pacote (compras). Isso permite devolver a aula no cancelamento.
alter table public.agendamentos
  add column if not exists compra_id uuid references public.compras (id) on delete set null,
  add column if not exists consumiu_aula boolean not null default false;

-- 5) Troca as políticas "somente logados" por "somente dono" ----
do $$
declare
  t text;
begin
  foreach t in array array['alunos', 'aulas', 'aulas_suspensas', 'agendamentos', 'planos', 'compras']
  loop
    execute format(
      'drop policy if exists "%s - somente dono" on public.%s;
       create policy "%s - somente dono" on public.%s for all
       to authenticated using (auth.uid() = public.dono_id())
       with check (auth.uid() = public.dono_id());',
      t, t, t, t
    );
  end loop;
end $$;
