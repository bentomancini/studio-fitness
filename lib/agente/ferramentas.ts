import { Tool } from "@anthropic-ai/sdk/resources";

export const FERRAMENTAS_COPILOTO: Tool[] = [
  {
    name: "consultar_agenda",
    description:
      "Consulta a grade de aulas de um dia específico (ou hoje se não informada). Retorna os horários, tipo de aula, limite de vagas, total de inscritos, vagas restantes e a lista de alunos agendados.",
    input_schema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description:
            "Data no formato YYYY-MM-DD (ex: 2026-09-21). Se omitido, consulta o dia de hoje.",
        },
      },
    },
  },
  {
    name: "buscar_alunos",
    description:
      "Busca alunos cadastrados no estúdio por nome ou lista todos os alunos ativos. Retorna nome, telefone, status de saúde (dores/lesões), saldo de aulas e acordo de mensalidade.",
    input_schema: {
      type: "object",
      properties: {
        termo: {
          type: "string",
          description:
            "Nome ou parte do nome do aluno a pesquisar. Deixe vazio para listar todos os alunos ativos.",
        },
      },
    },
  },
  {
    name: "obter_ficha_aluno",
    description:
      "Obtém a ficha detalhada e completa de um aluno (dados pessoais, profissão, empresa, dores crônicas, lesões, preferências de treino, histórico de pagamentos e saldo).",
    input_schema: {
      type: "object",
      properties: {
        aluno_id: {
          type: "string",
          description: "ID do aluno no banco de dados.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno, caso o aluno_id não seja conhecido.",
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
          description: "ID do aluno (preferencial se disponível).",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno para busca automática caso o ID não seja fornecido.",
        },
        data: {
          type: "string",
          description: "Data da aula no formato YYYY-MM-DD.",
        },
        horario: {
          type: "string",
          description: "Horário da aula no formato HH:MM (ex: 08:00, 18:30).",
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
      "Cancela a reserva de um aluno em uma aula em uma data específica, liberando a vaga e devolvendo o saldo do pacote se aplicável.",
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
    name: "consultar_cobrancas",
    description:
      "Consulta as cobranças e mensalidades do estúdio. Permite filtrar por status: 'atrasadas' (inadimplentes), 'hoje' (vencendo hoje), 'proximas' (próximos 7 dias), 'pagas' ou 'todas'.",
    input_schema: {
      type: "object",
      properties: {
        filtro: {
          type: "string",
          enum: ["todas", "atrasadas", "hoje", "proximas", "pagas"],
          description: "Filtro de cobrança desejado.",
        },
        aluno_id: {
          type: "string",
          description: "Opcional: ID de um aluno específico para ver apenas suas cobranças.",
        },
        nome_aluno: {
          type: "string",
          description: "Opcional: Nome de um aluno para ver apenas suas cobranças.",
        },
      },
    },
  },
  {
    name: "marcar_cobranca_paga",
    description:
      "Registra o recebimento de uma cobrança ou mensalidade, atualizando para 'pago' e gerando a mensalidade do próximo mês.",
    input_schema: {
      type: "object",
      properties: {
        cobranca_id: {
          type: "string",
          description: "ID da cobrança a dar baixa.",
        },
        nome_aluno: {
          type: "string",
          description: "Nome do aluno, caso o ID da cobrança não seja informado.",
        },
        forma_pagamento: {
          type: "string",
          enum: ["pix", "dinheiro", "cartao_credito", "cartao_debito", "outro"],
          description: "Forma como o aluno pagou. Padrão: 'pix'.",
        },
        data_pagamento: {
          type: "string",
          description: "Data do pagamento no formato YYYY-MM-DD (se omitido, usa a data atual).",
        },
      },
    },
  },
  {
    name: "criar_cobranca_avulsa",
    description:
      "Lança uma cobrança avulsa (ex: matrícula, avaliação física, pacote avulso) para um aluno.",
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
          description: "Descrição da cobrança (ex: 'Matrícula', 'Avaliação Física', 'Suplemento').",
        },
        valor: {
          type: "number",
          description: "Valor em Reais (ex: 80.00, 150.00).",
        },
        data_vencimento: {
          type: "string",
          description: "Data de vencimento no formato YYYY-MM-DD.",
        },
        observacao: {
          type: "string",
          description: "Anotação ou observação opcional.",
        },
      },
      required: ["valor", "data_vencimento"],
    },
  },
];
