import { Tool } from "@anthropic-ai/sdk/resources";

export const FERRAMENTAS_COPILOTO: Tool[] = [
  // ==========================================================================
  // 1) GESTÃO DE ALUNOS (CRUD COMPLETO)
  // ==========================================================================
  {
    name: "buscar_alunos",
    description:
      "Busca alunos cadastrados no estúdio por nome ou lista todos os alunos. Retorna nome, telefone, status (ativo/inativo), dores crônicas, valor de mensalidade e dia de vencimento.",
    input_schema: {
      type: "object",
      properties: {
        termo: {
          type: "string",
          description:
            "Nome ou trecho do nome do aluno. Deixe vazio para listar todos os alunos.",
        },
        filtro: {
          type: "string",
          enum: ["todos", "ativos", "inativos"],
          description: "Filtrar por status. Padrão: 'ativos'.",
        },
      },
    },
  },
  {
    name: "obter_ficha_aluno",
    description:
      "Obtém a ficha detalhada e completa de um aluno (dados cadastrais, data de nascimento, profissão, empresa, histórico clínico de dores e lesões, estilo de treino, observações e dados financeiros).",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno no banco de dados.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para busca fuzzy caso o aluno_id não seja conhecido.",
        },
      },
    },
  },
  {
    name: "cadastrar_aluno",
    description:
      "Cadastra um novo aluno no estúdio com todos os dados pessoais, de saúde e financeiros. Cria a ficha completa e sincroniza a mensalidade.",
    input_schema: {
      type: "object",
      properties: {
        nome: {
          type: "string",
          description: "Nome completo do aluno (obrigatório).",
        },
        telefone: {
          type: "string",
          description: "Telefone / WhatsApp com DDD (ex: 11999998888).",
        },
        valor_mensalidade: {
          type: "number",
          description: "Valor da mensalidade em Reais (ex: 200, 250.50).",
        },
        dia_vencimento: {
          type: "number",
          description: "Dia do mês em que vence a mensalidade (1 a 31).",
        },
        periodicidade: {
          type: "string",
          enum: ["mensal", "trimestral"],
          description: "Periodicidade do plano (padrão: 'mensal').",
        },
        data_nascimento: {
          type: "string",
          description: "Data de nascimento no formato YYYY-MM-DD.",
        },
        profissao: {
          type: "string",
          description: "Profissão do aluno.",
        },
        tem_empresa: {
          type: "boolean",
          description: "Indica se o aluno é empresário/tem empresa.",
        },
        empresa_nome: {
          type: "string",
          description: "Nome da empresa do aluno.",
        },
        empresa_ramo: {
          type: "string",
          description: "Ramo de atuação da empresa.",
        },
        tem_dores_cronicas: {
          type: "boolean",
          description: "Indica se o aluno relata dores crônicas.",
        },
        dores_cronicas_descricao: {
          type: "string",
          description: "Detalhes das dores crônicas (ex: lombar, joelho direito).",
        },
        lesoes: {
          type: "string",
          description: "Histórico de lesões ou cirurgias.",
        },
        estilo_treino: {
          type: "string",
          description: "Preferências de treino ou metas.",
        },
        observacoes: {
          type: "string",
          description: "Observações gerais sobre o aluno.",
        },
        status: {
          type: "string",
          enum: ["ativo", "inativo"],
          description: "Status inicial do aluno (padrão: 'ativo').",
        },
      },
      required: ["nome"],
    },
  },
  {
    name: "atualizar_aluno",
    description:
      "Atualiza os dados cadastrais, financeiros, clínicos ou de contato de um aluno existente.",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno a ser atualizado.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno caso o ID não seja fornecido.",
        },
        nome: {
          type: "string",
          description: "Novo nome.",
        },
        telefone: {
          type: "string",
          description: "Novo telefone com DDD.",
        },
        valor_mensalidade: {
          type: "number",
          description: "Novo valor da mensalidade em Reais.",
        },
        dia_vencimento: {
          type: "number",
          description: "Novo dia de vencimento (1 a 31).",
        },
        periodicidade: {
          type: "string",
          enum: ["mensal", "trimestral"],
          description: "Nova periodicidade.",
        },
        status: {
          type: "string",
          enum: ["ativo", "inativo"],
          description: "Alterar status do aluno.",
        },
        observacoes: {
          type: "string",
          description: "Novas observações gerais.",
        },
        dores_cronicas_descricao: {
          type: "string",
          description: "Atualizar descrição de dores crônicas.",
        },
        lesoes: {
          type: "string",
          description: "Atualizar lesões ou restrições de exercício.",
        },
        estilo_treino: {
          type: "string",
          description: "Atualizar estilo de treino.",
        },
      },
    },
  },
  {
    name: "alternar_status_aluno",
    description:
      "Ativa ou inativa o cadastro de um aluno no estúdio.",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno.",
        },
        novo_status: {
          type: "string",
          enum: ["ativo", "inativo"],
          description: "Status desejado.",
        },
      },
    },
  },
  {
    name: "excluir_aluno",
    description:
      "Remove definitivamente um aluno do sistema do estúdio.",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para exclusão.",
        },
      },
    },
  },

  // ==========================================================================
  // 2) GESTÃO DE AULAS E GRADE SEMANAL (CRUD COMPLETO)
  // ==========================================================================
  {
    name: "listar_grade_aulas",
    description:
      "Lista todos os horários fixos cadastrados na grade semanal do estúdio, com dia da semana, horário, modalidade, limite de vagas e se está ativo.",
    input_schema: {
      type: "object",
      properties: {
        dia_semana: {
          type: "number",
          description: "Opcional: filtrar por dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado).",
        },
        somente_ativas: {
          type: "boolean",
          description: "Se true, lista apenas aulas ativas. Padrão: false (mostra todas).",
        },
      },
    },
  },
  {
    name: "criar_aula",
    description:
      "Cria um novo horário fixo de aula na grade semanal do estúdio.",
    input_schema: {
      type: "object",
      properties: {
        tipo_aula: {
          type: "string",
          description: "Nome da modalidade/tipo de aula (ex: 'Personal / Funcional', 'Pilates', 'Treino Personalizado').",
        },
        dia_semana: {
          type: "number",
          description: "Dia da semana (0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado).",
        },
        horario: {
          type: "string",
          description: "Horário de início da aula no formato HH:MM (ex: '07:00', '18:30').",
        },
        limite_vagas: {
          type: "number",
          description: "Limite de alunos simultâneos (ex: 4, 5).",
        },
      },
      required: ["tipo_aula", "dia_semana", "horario", "limite_vagas"],
    },
  },
  {
    name: "atualizar_aula",
    description:
      "Atualiza uma aula existente na grade semanal (altera horário, modalidade, vagas ou dia da semana).",
    input_schema: {
      type: "object",
      properties: {
        aula_id: {
          type: "string",
          description: "ID da aula a ser alterada.",
        },
        tipo_aula: {
          type: "string",
          description: "Novo tipo de aula.",
        },
        dia_semana: {
          type: "number",
          description: "Novo dia da semana (0 a 6).",
        },
        horario: {
          type: "string",
          description: "Novo horário no formato HH:MM.",
        },
        limite_vagas: {
          type: "number",
          description: "Novo limite de vagas.",
        },
      },
      required: ["aula_id"],
    },
  },
  {
    name: "alternar_aula_ativa",
    description:
      "Ativa ou desativa um horário na grade de aulas do estúdio.",
    input_schema: {
      type: "object",
      properties: {
        aula_id: {
          type: "string",
          description: "ID da aula a ativar ou desativar.",
        },
        ativa: {
          type: "boolean",
          description: "True para ativar, false para desativar.",
        },
      },
      required: ["aula_id"],
    },
  },
  {
    name: "excluir_aula",
    description:
      "Exclui permanentemente um horário da grade de aulas do estúdio.",
    input_schema: {
      type: "object",
      properties: {
        aula_id: {
          type: "string",
          description: "ID da aula a ser removida.",
        },
      },
      required: ["aula_id"],
    },
  },

  // ==========================================================================
  // 3) GESTÃO DE AGENDA, AGENDAMENTOS E SUSPENSÕES
  // ==========================================================================
  {
    name: "consultar_agenda",
    description:
      "Consulta a grade de aulas e ocupação de um dia específico (ou hoje se não informada). Retorna horários, limites de vagas, ocupação atual, vagas livres e alunos confirmados.",
    input_schema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description: "Data no formato YYYY-MM-DD (ex: 2026-09-21). Se omitido, consulta hoje.",
        },
      },
    },
  },
  {
    name: "agendar_aluno",
    description:
      "Inscreve um aluno em uma aula em um horário e dia específicos. Consome aula de pacote se aplicável.",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para busca automática caso o ID não seja informado.",
        },
        data: {
          type: "string",
          description: "Data da aula no formato YYYY-MM-DD.",
        },
        horario: {
          type: "string",
          description: "Horário da aula no formato HH:MM (ex: '08:00', '18:00').",
        },
        aula_id: {
          type: "string",
          description: "ID direto da aula, se já conhecido.",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "cancelar_agendamento",
    description:
      "Cancela o agendamento de um aluno em uma aula em uma data específica, liberando a vaga no horário.",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para busca.",
        },
        data: {
          type: "string",
          description: "Data da aula no formato YYYY-MM-DD.",
        },
        horario: {
          type: "string",
          description: "Horário da aula no formato HH:MM.",
        },
        aula_id: {
          type: "string",
          description: "ID da aula, se conhecido.",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "suspender_aula",
    description:
      "Suspende uma aula em uma data específica (ex: feriado, recesso, imprevisto) sem apagar a aula da grade semanal.",
    input_schema: {
      type: "object",
      properties: {
        aula_id: {
          type: "string",
          description: "ID da aula a suspender.",
        },
        data: {
          type: "string",
          description: "Data específica a suspender (YYYY-MM-DD).",
        },
        horario: {
          type: "string",
          description: "Horário da aula, caso o ID da aula não seja fornecido.",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "reativar_aula_suspensa",
    description:
      "Reativa uma aula que havia sido suspensa em uma data específica.",
    input_schema: {
      type: "object",
      properties: {
        aula_id: {
          type: "string",
          description: "ID da aula a reativar.",
        },
        data: {
          type: "string",
          description: "Data em que a aula estava suspensa (YYYY-MM-DD).",
        },
        horario: {
          type: "string",
          description: "Horário da aula, caso o ID da aula não seja fornecido.",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "trocar_horario_aluno",
    description:
      "Transfere um aluno de um horário de aula para outro horário em uma data.",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno.",
        },
        data: {
          type: "string",
          description: "Data da transferência no formato YYYY-MM-DD.",
        },
        horario_origem: {
          type: "string",
          description: "Horário atual de onde o aluno vai sair (HH:MM).",
        },
        horario_destino: {
          type: "string",
          description: "Novo horário para onde o aluno vai ser transferido (HH:MM).",
        },
      },
      required: ["data", "horario_origem", "horario_destino"],
    },
  },

  // ==========================================================================
  // 4) GESTÃO DE COBRANÇAS E FINANCEIRO
  // ==========================================================================
  {
    name: "consultar_cobrancas",
    description:
      "Consulta as cobranças e mensalidades do estúdio. Permite filtrar por: 'atrasadas', 'hoje', 'proximas' (próximos 7 dias), 'pagas' ou 'todas'.",
    input_schema: {
      type: "object",
      properties: {
        filtro: {
          type: "string",
          enum: ["todas", "atrasadas", "hoje", "proximas", "pagas"],
          description: "Filtro de cobranças.",
        },
        aluno_id: {
          type: "string",
          description: "Opcional: ID de um aluno para ver apenas cobranças dele.",
        },
        nome_aluno: {
          type: "string",
          description: "Opcional: Nome de um aluno para filtrar suas cobranças.",
        },
      },
    },
  },
  {
    name: "resumo_financeiro",
    description:
      "Retorna o resumo financeiro consolidado do estúdio: total faturado/recebido no mês, total em atraso (inadimplência), valor a vencer e contagem de mensalidades.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "marcar_cobranca_paga",
    description:
      "Registra o pagamento de uma mensalidade/cobrança, marcando como paga e gerando automaticamente a mensalidade do próximo mês para planos recorrentes.",
    input_schema: {
      type: "object",
      properties: {
        cobranca_id: {
          type: "string",
          description: "ID da cobrança.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno, caso o ID da cobrança não seja informado.",
        },
        forma_pagamento: {
          type: "string",
          enum: ["pix", "dinheiro", "cartao_credito", "cartao_debito", "outro"],
          description: "Forma de pagamento (padrão: 'pix').",
        },
        data_pagamento: {
          type: "string",
          description: "Data do pagamento no formato YYYY-MM-DD (se omitido, usa hoje).",
        },
      },
    },
  },
  {
    name: "desfazer_pagamento",
    description:
      "Desfaz a baixa de um pagamento registrado por engano, retornando o status para pendente e limpando cobrança futura duplicada.",
    input_schema: {
      type: "object",
      properties: {
        cobranca_id: {
          type: "string",
          description: "ID da cobrança paga a estornar.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para localizar a cobrança.",
        },
      },
    },
  },
  {
    name: "criar_cobranca_avulsa",
    description:
      "Lança uma cobrança avulsa (ex: Matrícula, Avaliação Física, Pacote Avulso, Camiseta) para um aluno.",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para localizar.",
        },
        titulo: {
          type: "string",
          description: "Título/descrição da cobrança (ex: 'Avaliação Física', 'Matrícula 2026').",
        },
        valor: {
          type: "number",
          description: "Valor em Reais (ex: 80.00, 150.00).",
        },
        data_vencimento: {
          type: "string",
          description: "Data de vencimento (YYYY-MM-DD).",
        },
        observacao: {
          type: "string",
          description: "Observação opcional.",
        },
      },
      required: ["valor", "data_vencimento"],
    },
  },
  {
    name: "atualizar_cobranca",
    description:
      "Atualiza o valor, data de vencimento, título ou observação de uma cobrança existente.",
    input_schema: {
      type: "object",
      properties: {
        cobranca_id: {
          type: "string",
          description: "ID da cobrança a ser editada.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para buscar a cobrança caso o ID não seja informado.",
        },
        valor: {
          type: "number",
          description: "Novo valor em Reais.",
        },
        data_vencimento: {
          type: "string",
          description: "Nova data de vencimento (YYYY-MM-DD).",
        },
        titulo: {
          type: "string",
          description: "Novo título.",
        },
        observacao: {
          type: "string",
          description: "Nova observação.",
        },
      },
    },
  },
  {
    name: "cancelar_cobranca",
    description:
      "Cancela uma cobrança no estúdio.",
    input_schema: {
      type: "object",
      properties: {
        cobranca_id: {
          type: "string",
          description: "ID da cobrança a cancelar.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno, caso o ID da cobrança não seja conhecido.",
        },
      },
    },
  },
  {
    name: "obter_configuracoes_cobranca",
    description:
      "Consulta as configurações financeiras do estúdio: chave PIX cadastrada, nome do estúdio e modelos de mensagens de WhatsApp.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "atualizar_configuracoes_cobranca",
    description:
      "Atualiza a chave PIX, nome do estúdio ou modelos de mensagens de cobrança do WhatsApp.",
    input_schema: {
      type: "object",
      properties: {
        chave_pix: {
          type: "string",
          description: "Nova chave PIX do estúdio.",
        },
        studio_nome: {
          type: "string",
          description: "Novo nome de exibição do estúdio.",
        },
        msg_antecipada: {
          type: "string",
          description: "Modelo da mensagem de lembrete prévio.",
        },
        msg_hoje: {
          type: "string",
          description: "Modelo da mensagem de vencimento hoje.",
        },
        msg_atraso: {
          type: "string",
          description: "Modelo da mensagem de cobrança em atraso.",
        },
      },
    },
  },

  // ==========================================================================
  // 5) VISÃO GERAL 360° DO ESTÚDIO
  // ==========================================================================
  {
    name: "obter_visao_geral_estudio",
    description:
      "Retorna um panorama 360° do estúdio em tempo real: total de alunos ativos, ocupação das aulas hoje, faturamento do mês, cobranças atrasadas e alertas operacionais.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];
