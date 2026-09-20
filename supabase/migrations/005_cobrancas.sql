-- =============================================================
-- 005_cobrancas.sql - Módulo de Cobranças & Controle Financeiro
-- Adiciona acordo financeiro no cadastro de alunos e cria a
-- tabela de cobranças com histórico de contatos e segurança RLS.
-- Aplique no Supabase: SQL Editor > New query > colar > Run.
-- =============================================================

-- 1) Acordo financeiro padrão na tabela de alunos ----------------
alter table public.alunos
  add column if not exists valor_mensalidade numeric(10, 2) check (valor_mensalidade is null or valor_mensalidade > 0),
  add column if not exists dia_vencimento smallint check (dia_vencimento is null or (dia_vencimento between 1 and 31)),
  add column if not exists plano_padrao_id uuid references public.planos (id) on delete set null;

-- 2) Tabela de Cobranças -----------------------------------------
create table if not exists public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos (id) on delete cascade,
  plano_id uuid references public.planos (id) on delete set null,
  titulo text not null default 'Mensalidade' check (char_length(titulo) between 1 and 120),
  valor numeric(10, 2) not null check (valor > 0),
  data_vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  data_pagamento date,
  forma_pagamento text check (forma_pagamento is null or forma_pagamento in ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'outro')),
  observacao text not null default '' check (char_length(observacao) <= 1000),
  tipo text not null default 'recorrente' check (tipo in ('recorrente', 'avulsa')),
  
  -- Controle de contatos via WhatsApp ("Abri o WhatsApp")
  ultimo_contato_em timestamptz,
  qtd_contatos integer not null default 0 check (qtd_contatos >= 0),
  
  -- Identificador de ciclo (ex.: '2026-10') para prevenir cobranças duplicadas no mesmo mês
  mes_referencia text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para buscas rápidas no painel mobile
create index if not exists cobrancas_aluno_idx on public.cobrancas (aluno_id);
create index if not exists cobrancas_vencimento_idx on public.cobrancas (data_vencimento);
create index if not exists cobrancas_status_idx on public.cobrancas (status);

-- 3) Trigger de updated_at automático ---------------------------
drop trigger if exists cobrancas_updated_at on public.cobrancas;
create trigger cobrancas_updated_at
  before update on public.cobrancas
  for each row execute function public.touch_updated_at();

-- 4) Segurança RLS (Row Level Security) -------------------------
-- Somente o usuário dono autenticado tem acesso total.
-- Nenhuma leitura ou escrita anônima é permitida.
alter table public.cobrancas enable row level security;

drop policy if exists "cobrancas - somente dono" on public.cobrancas;
drop policy if exists "cobrancas - somente logados" on public.cobrancas;
create policy "cobrancas - somente logados"
  on public.cobrancas for all
  to authenticated
  using (true)
  with check (true);

-- 5) Configurações padrão de cobrança e modelos de mensagem -----
insert into public.config (chave, valor)
values
  ('cobranca_pix_chave', ''),
  ('cobranca_studio_nome', 'Intense Fitness'),
  ('cobranca_msg_antecipada', 'Olá, {primeiro_nome}! Passando para lembrar que sua mensalidade da Intense Fitness no valor de R$ {valor} vence no dia {vencimento}. Chave Pix: {chave_pix}. Qualquer dúvida, me avise!'),
  ('cobranca_msg_hoje', 'Olá, {primeiro_nome}! Sua mensalidade da Intense Fitness no valor de R$ {valor} vence hoje ({vencimento}). Segue a chave Pix para pagamento: {chave_pix}. Obrigado!'),
  ('cobranca_msg_atraso', 'Olá, {primeiro_nome}, tudo bem? Não identificamos o pagamento da sua mensalidade da Intense Fitness no valor de R$ {valor}, vencida em {vencimento}. Segue nossa chave Pix: {chave_pix}. Caso já tenha pago, por favor desconsidere!')
on conflict (chave) do nothing;
