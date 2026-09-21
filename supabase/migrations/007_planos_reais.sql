-- =============================================================
-- 007_planos_reais.sql - Cadastro dos Planos Reais do Studio
-- Adiciona campos modernos à tabela de planos (preço mensal,
-- frequência semanal, categoria, descrição) e cadastra os 5 planos
-- de Atendimento e Treinamento Personalizado (1x a 5x por semana).
-- Adiciona também a periodicidade (mensal/trimestral) nos alunos.
--
-- Aplique no Supabase: SQL Editor > New query > colar > Run.
-- =============================================================

-- 1) Adiciona colunas retrocompatíveis na tabela de planos -------
alter table public.planos
  add column if not exists categoria text not null default 'Atendimento e treinamento personalizado',
  add column if not exists frequencia_semanal smallint check (frequencia_semanal is null or (frequencia_semanal between 1 and 7)),
  add column if not exists preco_mensal numeric(10, 2) check (preco_mensal is null or preco_mensal > 0),
  add column if not exists descricao text not null default '',
  add column if not exists updated_at timestamptz not null default now();

-- 2) Adiciona periodicidade na tabela de alunos ------------------
-- Padrão 'mensal'. Alunos atuais continuam intactos.
alter table public.alunos
  add column if not exists periodicidade text not null default 'mensal' check (periodicidade in ('mensal', 'trimestral'));

-- 3) Adiciona periodicidade na tabela de cobrancas ---------------
alter table public.cobrancas
  add column if not exists periodicidade text check (periodicidade is null or periodicidade in ('mensal', 'trimestral', 'avulsa'));

-- 4) Políticas de Segurança RLS na tabela planos ----------------
alter table public.planos enable row level security;

drop policy if exists "planos - somente dono" on public.planos;
drop policy if exists "planos - somente logados" on public.planos;

create policy "planos - somente logados"
  on public.planos for all
  to authenticated
  using (true)
  with check (true);

-- 5) Cadastra os 5 Planos Reais de Atendimento Personalizado ----
-- Se o plano já existir com o mesmo nome, não duplica.
insert into public.planos (nome, categoria, frequencia_semanal, preco_mensal, qtd_aulas, validade_dias, descricao, ativo)
select '1x por semana', 'Atendimento e treinamento personalizado', 1, 319.90, 4, 30, '1 atendimento personalizado por semana', true
where not exists (select 1 from public.planos where nome = '1x por semana');

insert into public.planos (nome, categoria, frequencia_semanal, preco_mensal, qtd_aulas, validade_dias, descricao, ativo)
select '2x por semana', 'Atendimento e treinamento personalizado', 2, 349.90, 8, 30, '2 atendimentos personalizados por semana', true
where not exists (select 1 from public.planos where nome = '2x por semana');

insert into public.planos (nome, categoria, frequencia_semanal, preco_mensal, qtd_aulas, validade_dias, descricao, ativo)
select '3x por semana', 'Atendimento e treinamento personalizado', 3, 469.90, 12, 30, '3 atendimentos personalizados por semana', true
where not exists (select 1 from public.planos where nome = '3x por semana');

insert into public.planos (nome, categoria, frequencia_semanal, preco_mensal, qtd_aulas, validade_dias, descricao, ativo)
select '4x por semana', 'Atendimento e treinamento personalizado', 4, 589.90, 16, 30, '4 atendimentos personalizados por semana', true
where not exists (select 1 from public.planos where nome = '4x por semana');

insert into public.planos (nome, categoria, frequencia_semanal, preco_mensal, qtd_aulas, validade_dias, descricao, ativo)
select '5x por semana', 'Atendimento e treinamento personalizado', 5, 699.90, 20, 30, '5 atendimentos personalizados por semana', true
where not exists (select 1 from public.planos where nome = '5x por semana');
