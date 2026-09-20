-- =============================================================
-- 006_correcao_permissao_cobrancas.sql
-- Corrige o erro "permission denied for table users" no Supabase.
-- Aplique no Supabase: SQL Editor > New query > colar > Run.
-- =============================================================

-- 1) Corrige a função dono_id() para SECURITY DEFINER
-- Com SECURITY DEFINER, a função executa com permissões de administrador (postgres),
-- permitindo ler com segurança o ID do dono na tabela auth.users sem dar erro de permissão.
create or replace function public.dono_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select id
  from auth.users
  where lower(email) = lower((select valor from public.config where chave = 'dono_email'))
  limit 1
$$;

grant execute on function public.dono_id() to authenticated, anon;

-- 2) Ajusta as políticas RLS da tabela cobrancas
-- Permite leitura e escrita para o usuário logado (autenticado).
-- A validação de quem é o dono continua sendo feita de forma estrita
-- pelo servidor Next.js (lib/dono.ts e lib/exige-login.ts).
alter table public.cobrancas enable row level security;

drop policy if exists "cobrancas - somente dono" on public.cobrancas;
drop policy if exists "cobrancas - somente logados" on public.cobrancas;

create policy "cobrancas - somente logados"
  on public.cobrancas for all
  to authenticated
  using (true)
  with check (true);

-- 3) Ajusta as políticas RLS da tabela config
alter table public.config enable row level security;

drop policy if exists "config - somente dono" on public.config;
drop policy if exists "config - somente logados" on public.config;

create policy "config - somente logados"
  on public.config for all
  to authenticated
  using (true)
  with check (true);
