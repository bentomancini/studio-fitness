-- =============================================================
-- 008_rls_apenas_dono.sql - Restringe TODAS as tabelas ao dono
--
-- CORRIGE o alerta de segurança: em migrações anteriores
-- (005, 006 e 007), as políticas de cobrancas, config e planos
-- ficaram com `using (true)`, liberando o acesso total a
-- QUALQUER usuário autenticado no projeto.
--
-- Esta migração volta a exigir auth.uid() = public.dono_id()
-- em todas as tabelas. A função dono_id() é SECURITY DEFINER
-- e lê o e-mail do dono da tabela public.config (chave
-- 'dono_email').
--
-- Aplique no Supabase: SQL Editor > New query > colar > Run.
-- PODE RODAR QUANTAS VEZES PRECISAR (todas as operações usam
-- drop policy if exists / create policy).
-- =============================================================

-- 1) Garante RLS ligado em todas as tabelas ----------------------
alter table public.alunos enable row level security;
alter table public.aulas enable row level security;
alter table public.aulas_suspensas enable row level security;
alter table public.agendamentos enable row level security;
alter table public.planos enable row level security;
alter table public.compras enable row level security;
alter table public.cobrancas enable row level security;
alter table public.config enable row level security;

-- 2) Remove qualquer política genérica "somente logados" que sobrou
do $$
declare
  r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname ilike '%logados%'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 3) Garante que as tabelas dependentes têm a permissão de execução
--    da função dono_id() (a 006 já concede; aqui reforça para quem
--    está migrando de um banco mais antigo).
grant execute on function public.dono_id() to authenticated, anon;

-- 4) Recria as políticas de todas as tabelas exigindo o dono -------
do $$
declare
  t text;
begin
  foreach t in array array[
    'alunos', 'aulas', 'aulas_suspensas', 'agendamentos',
    'planos', 'compras', 'cobrancas', 'config'
  ]
  loop
    execute format(
      'drop policy if exists "%s - somente dono" on public.%s;
       create policy "%s - somente dono" on public.%s for all
       to authenticated
       using (auth.uid() = public.dono_id())
       with check (auth.uid() = public.dono_id());',
      t, t, t, t
    );
  end loop;
end $$;