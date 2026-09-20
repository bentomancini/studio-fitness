-- =============================================================
-- 004_ficha_aluno.sql - Expansão da ficha completa do aluno
-- Adiciona novos campos para dados pessoais, saúde/treino e vínculo.
-- Totalmente compatível com os alunos já cadastrados (todas as colunas aceitam nulo/padrão).
-- RLS continua ativo e restrito somente ao dono (bentomancini@gmail.com).
-- =============================================================

alter table public.alunos
  -- 1) Dados pessoais
  add column if not exists data_nascimento date,
  add column if not exists profissao text check (char_length(profissao) <= 120),
  add column if not exists tem_empresa boolean not null default false,
  add column if not exists empresa_nome text check (char_length(empresa_nome) <= 120),
  add column if not exists empresa_ramo text check (char_length(empresa_ramo) <= 120),

  -- 2) Saúde e treino
  add column if not exists tem_dores_cronicas boolean not null default false,
  add column if not exists dores_cronicas_descricao text check (char_length(dores_cronicas_descricao) <= 1000),
  add column if not exists lesoes text check (char_length(lesoes) <= 1000),
  add column if not exists estilo_treino text check (char_length(estilo_treino) <= 1000),

  -- 3) Conhecendo o aluno (vínculo)
  add column if not exists descricao_aluno text check (char_length(descricao_aluno) <= 3000);
