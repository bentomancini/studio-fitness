-- =============================================================
-- Studio Fitness - esquema inicial (tabelas + segurança RLS)
-- Este arquivo é a fonte da verdade. Aplique uma única vez no
-- Supabase, pelo SQL Editor (Dashboard > SQL Editor > New query).
-- =============================================================

-- 1) Alunos -----------------------------------------------------
create table if not exists public.alunos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 1 and 120),
  telefone    text not null default '' check (char_length(telefone) <= 30),
  observacoes text not null default '' check (char_length(observacoes) <= 2000),
  status      text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) Aulas (horários fixos da semana) ---------------------------
-- dia_semana: 0 = domingo, 1 = segunda ... 6 = sábado
create table if not exists public.aulas (
  id           uuid primary key default gen_random_uuid(),
  tipo_aula    text not null check (char_length(tipo_aula) between 1 and 60),
  dia_semana   smallint not null check (dia_semana between 0 and 6),
  horario      time not null,
  limite_vagas smallint not null check (limite_vagas between 1 and 99),
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (dia_semana, horario, tipo_aula)
);

-- 3) Aulas suspensas em uma data específica (ex.: feriado) ------
create table if not exists public.aulas_suspensas (
  id          uuid primary key default gen_random_uuid(),
  aula_id     uuid not null references public.aulas (id) on delete cascade,
  data        date not null,
  observacao  text not null default '',
  created_at  timestamptz not null default now(),
  unique (aula_id, data)
);

-- 4) Agendamentos (aluno marcado em uma aula, em uma data) ------
create table if not exists public.agendamentos (
  id         uuid primary key default gen_random_uuid(),
  aula_id    uuid not null references public.aulas (id) on delete cascade,
  aluno_id   uuid not null references public.alunos (id) on delete cascade,
  data       date not null,
  created_at timestamptz not null default now(),
  unique (aula_id, aluno_id, data)
);

create index if not exists agendamentos_aula_data_idx on public.agendamentos (aula_id, data);
create index if not exists agendamentos_aluno_idx on public.agendamentos (aluno_id);
create index if not exists agendamentos_data_idx  on public.agendamentos (data);

-- 5) Planos (cardápio de pacotes de aula) -----------------------
create table if not exists public.planos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null check (char_length(nome) between 1 and 60),
  qtd_aulas     smallint not null check (qtd_aulas >= 1),
  validade_dias smallint check (validade_dias is null or validade_dias >= 1),
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 6) Compras (pacotes de cada aluno + aulas restantes) ----------
create table if not exists public.compras (
  id                  uuid primary key default gen_random_uuid(),
  aluno_id            uuid not null references public.alunos (id) on delete cascade,
  plano_id            uuid not null references public.planos (id) on delete restrict,
  qtd_aulas_restantes smallint not null check (qtd_aulas_restantes >= 0),
  data_compra         date not null default current_date,
  validade            date check (validade is null or validade >= data_compra),
  created_at          timestamptz not null default now()
);

create index if not exists compras_aluno_idx on public.compras (aluno_id);

-- 7) Atualiza updated_at automaticamente -------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists alunos_updated_at on public.alunos;
create trigger alunos_updated_at
  before update on public.alunos
  for each row execute function public.touch_updated_at();

drop trigger if exists aulas_updated_at on public.aulas;
create trigger aulas_updated_at
  before update on public.aulas
  for each row execute function public.touch_updated_at();

-- 8) Segurança (Row Level Security) ------------------------------
-- A única pessoa que fará login é o administrador. Portanto, tudo
-- o que o usuário logado (papel authenticated) pode fazer com os
-- dados: ler, criar, alterar e apagar. Qualquer pessoa não logada
-- é bloqueada pelo banco, mesmo conhecendo as URLs.
alter table public.alunos enable row level security;
alter table public.aulas enable row level security;
alter table public.aulas_suspensas enable row level security;
alter table public.agendamentos enable row level security;
alter table public.planos enable row level security;
alter table public.compras enable row level security;

create policy "alunos - somente logados"
  on public.alunos for all
  to authenticated
  using (true) with check (true);

create policy "aulas - somente logados"
  on public.aulas for all
  to authenticated
  using (true) with check (true);

create policy "aulas_suspensas - somente logados"
  on public.aulas_suspensas for all
  to authenticated
  using (true) with check (true);

create policy "agendamentos - somente logados"
  on public.agendamentos for all
  to authenticated
  using (true) with check (true);

create policy "planos - somente logados"
  on public.planos for all
  to authenticated
  using (true) with check (true);

create policy "compras - somente logados"
  on public.compras for all
  to authenticated
  using (true) with check (true);