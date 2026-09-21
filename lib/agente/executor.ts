import Anthropic from "@anthropic-ai/sdk";
import { obterClienteClaude, MODELO_PADRAO } from "./anthropic";
import { FERRAMENTAS_COPILOTO } from "./ferramentas";
import { dataHoje, diaDaSemana, DIAS_SEMANA, formatarData } from "@/lib/constantes";
import { carregarAgenda } from "@/lib/services/agenda";
import { agendarAula, cancelarAgendamento } from "@/lib/services/agendamentos";
import { buscarAluno } from "@/lib/services/alunos";
import {
  listarPainelCobrancas,
  marcarComoPago,
  criarCobrancaAvulsa,
  obterResumoCobrancaAluno,
} from "@/lib/services/cobrancas";
import { exigeDono } from "@/lib/exige-login";

export type MensagemChat = {
  role: "user" | "assistant";
  content: string;
};

export type AcaoExecutada = {
  tipo: "agendamento" | "cancelamento" | "pagamento" | "cobranca_avulsa" | "consulta";
  titulo: string;
  detalhes: string;
  sucesso: boolean;
};

export type RespostaCopiloto = {
  ok: boolean;
  resposta: string;
  acoes: AcaoExecutada[];
  erro?: string;
};

// ============================================================================
// AUXILIARES DE BUSCA FUZZY
// ============================================================================
async function encontrarAlunoPorNomeOuId(identificador?: string) {
  if (!identificador) return null;
  const supabase = await exigeDono();

  // Se já for um UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identificador)) {
    const { data } = await supabase.from("alunos").select("id, nome, telefone").eq("id", identificador).maybeSingle();
    if (data) return data;
  }

  // Busca por nome aproximado
  const termo = identificador.trim().toLowerCase();
  const { data: alunos } = await supabase.from("alunos").select("id, nome, telefone, status");
  if (!alunos || alunos.length === 0) return null;

  // 1) Match exato
  const exato = alunos.find((a) => a.nome.toLowerCase() === termo);
  if (exato) return exato;

  // 2) Match com primeiro nome ou prefixo
  const prefixo = alunos.find((a) => a.nome.toLowerCase().startsWith(termo));
  if (prefixo) return prefixo;

  // 3) Match contido
  const contido = alunos.find((a) => a.nome.toLowerCase().includes(termo));
  if (contido) return contido;

  return null;
}

// ============================================================================
// EXECUTOR DE FERRAMENTAS DO CLAUDE
// ============================================================================
export async function executarFerramenta(
  nome: string,
  args: Record<string, unknown>
): Promise<{ resultado: unknown; acao?: AcaoExecutada }> {
  try {
    switch (nome) {
      // ----------------------------------------------------------------------
      // 1) CONSULTAR AGENDA
      // ----------------------------------------------------------------------
      case "consultar_agenda": {
        const dataAlvo = typeof args.data === "string" && args.data ? args.data : dataHoje();
        const dow = diaDaSemana(dataAlvo);
        const nomeDia = DIAS_SEMANA[dow];

        const dadosAgenda = await carregarAgenda();
        const aulasDoDia = dadosAgenda.aulas.filter((a) => a.dia_semana === dow);

        const grade = aulasDoDia.map((aula) => {
          const suspensa = dadosAgenda.suspensoes.some(
            (s) => s.aula_id === aula.id && s.data === dataAlvo
          );
          const agendamentosAula = dadosAgenda.agendamentos.filter(
            (ag) => ag.aula_id === aula.id && ag.data === dataAlvo
          );
          const inscritos = agendamentosAula.map((ag) => {
            const al = dadosAgenda.alunos.find((a) => a.id === ag.aluno_id);
            return al ? al.nome : "Aluno desconhecido";
          });

          return {
            aula_id: aula.id,
            tipo_aula: aula.tipo_aula,
            horario: aula.horario.slice(0, 5),
            limite_vagas: aula.limite_vagas,
            total_inscritos: inscritos.length,
            vagas_restantes: Math.max(0, aula.limite_vagas - inscritos.length),
            suspensa,
            alunos_inscritos: inscritos,
          };
        });

        return {
          resultado: {
            data: dataAlvo,
            data_formatada: formatarData(dataAlvo),
            dia_semana: nomeDia,
            total_aulas: grade.length,
            grade,
          },
        };
      }

      // ----------------------------------------------------------------------
      // 2) BUSCAR ALUNOS
      // ----------------------------------------------------------------------
      case "buscar_alunos": {
        const supabase = await exigeDono();
        const termo = typeof args.termo === "string" ? args.termo.trim().toLowerCase() : "";

        let query = supabase.from("alunos").select("*").order("nome");
        if (termo) {
          query = query.ilike("nome", `%${termo}%`);
        }

        const { data: alunos, error } = await query;
        if (error) throw new Error(error.message);

        const formatados = (alunos || []).map((a) => ({
          id: a.id,
          nome: a.nome,
          telefone: a.telefone,
          status: a.status,
          valor_mensalidade: a.valor_mensalidade,
          dia_vencimento: a.dia_vencimento,
          dores_cronicas: a.tem_dores_cronicas ? a.dores_cronicas_descricao : null,
          lesoes: a.lesoes || null,
        }));

        return {
          resultado: {
            total_encontrados: formatados.length,
            alunos: formatados.slice(0, 15),
          },
        };
      }

      // ----------------------------------------------------------------------
      // 3) OBTER FICHA DO ALUNO
      // ----------------------------------------------------------------------
      case "obter_ficha_aluno": {
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achou = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achou) alunoId = achou.id;
        }

        if (!alunoId) {
          return { resultado: { erro: "Aluno não encontrado com o nome ou ID informado." } };
        }

        const ficha = await buscarAluno(alunoId);
        if (!ficha) return { resultado: { erro: "Ficha não encontrada." } };

        const resumoCobranca = await obterResumoCobrancaAluno(alunoId);

        return {
          resultado: {
            ...ficha,
            resumo_financeiro: resumoCobranca,
          },
        };
      }

      // ----------------------------------------------------------------------
      // 4) AGENDAR ALUNO
      // ----------------------------------------------------------------------
      case "agendar_aluno": {
        const dataAlvo = typeof args.data === "string" ? args.data : "";
        if (!dataAlvo) return { resultado: { erro: "Data é obrigatória." } };

        // 1. Identifica aluno
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        let alunoNome = "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achou = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achou) {
            alunoId = achou.id;
            alunoNome = achou.nome;
          }
        }

        if (!alunoId) {
          return { resultado: { erro: `Não encontrei o aluno "${args.nome_aluno || ""}". Verifique o nome.` } };
        }

        // 2. Identifica aula
        const dadosAgenda = await carregarAgenda();
        let aulaId = typeof args.aula_id === "string" ? args.aula_id : "";
        let aulaEncontrada = null;

        if (!aulaId) {
          const dow = diaDaSemana(dataAlvo);
          const horarioFiltro = typeof args.horario === "string" ? args.horario.trim().slice(0, 5) : "";
          const aulasDoDia = dadosAgenda.aulas.filter((a) => a.dia_semana === dow);

          if (horarioFiltro) {
            aulaEncontrada = aulasDoDia.find((a) => a.horario.startsWith(horarioFiltro));
          } else if (aulasDoDia.length === 1) {
            aulaEncontrada = aulasDoDia[0];
          }

          if (aulaEncontrada) {
            aulaId = aulaEncontrada.id;
          }
        }

        if (!aulaId) {
          return {
            resultado: {
              erro: `Não foi possível identificar o horário da aula para o dia ${formatarData(dataAlvo)}. Por favor informe o horário.`,
            },
          };
        }

        const res = await agendarAula(aulaId, alunoId, dataAlvo);
        const sucesso = Boolean(res.ok);

        return {
          resultado: res,
          acao: {
            tipo: "agendamento",
            titulo: sucesso ? "Agendamento Realizado" : "Falha ao Agendar",
            detalhes: sucesso
              ? `${alunoNome || "Aluno"} agendado(a) para ${formatarData(dataAlvo)}${aulaEncontrada ? ` às ${aulaEncontrada.horario.slice(0, 5)} (${aulaEncontrada.tipo_aula})` : ""}`
              : res.error || "Erro desconhecido",
            sucesso,
          },
        };
      }

      // ----------------------------------------------------------------------
      // 5) CANCELAR AGENDAMENTO
      // ----------------------------------------------------------------------
      case "cancelar_agendamento": {
        const dataAlvo = typeof args.data === "string" ? args.data : "";
        if (!dataAlvo) return { resultado: { erro: "Data é obrigatória." } };

        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        let alunoNome = "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achou = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achou) {
            alunoId = achou.id;
            alunoNome = achou.nome;
          }
        }

        if (!alunoId) {
          return { resultado: { erro: `Não encontrei o aluno "${args.nome_aluno || ""}".` } };
        }

        const dadosAgenda = await carregarAgenda();
        let aulaId = typeof args.aula_id === "string" ? args.aula_id : "";

        if (!aulaId) {
          // Procura agendamento desse aluno nessa data
          const agendamento = dadosAgenda.agendamentos.find(
            (ag) => ag.aluno_id === alunoId && ag.data === dataAlvo
          );
          if (agendamento) {
            aulaId = agendamento.aula_id;
          }
        }

        if (!aulaId) {
          return {
            resultado: {
              erro: `Não encontrei agendamento para ${alunoNome || "esse aluno"} no dia ${formatarData(dataAlvo)}.`,
            },
          };
        }

        const res = await cancelarAgendamento(aulaId, alunoId, dataAlvo);
        const sucesso = Boolean(res.ok);

        return {
          resultado: res,
          acao: {
            tipo: "cancelamento",
            titulo: sucesso ? "Agendamento Cancelado" : "Falha ao Cancelar",
            detalhes: sucesso
              ? `Vaga liberada para ${alunoNome || "Aluno"} no dia ${formatarData(dataAlvo)}.`
              : res.error || "Erro ao cancelar",
            sucesso,
          },
        };
      }

      // ----------------------------------------------------------------------
      // 6) CONSULTAR COBRANÇAS
      // ----------------------------------------------------------------------
      case "consultar_cobrancas": {
        const filtro = typeof args.filtro === "string" ? args.filtro : "todas";
        const painel = await listarPainelCobrancas();

        const cobrancasFiltradas = {
          atrasadas: painel.atrasadas.map((c) => ({
            id: c.id,
            aluno: c.aluno?.nome || "Aluno",
            valor: c.valor,
            vencimento: formatarData(c.data_vencimento),
            dias_atraso: Math.max(
              0,
              Math.floor(
                (new Date(dataHoje()).getTime() - new Date(c.data_vencimento).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            ),
          })),
          hoje: painel.hoje.map((c) => ({
            id: c.id,
            aluno: c.aluno?.nome || "Aluno",
            valor: c.valor,
            vencimento: formatarData(c.data_vencimento),
          })),
          proximas: painel.proximos.map((c) => ({
            id: c.id,
            aluno: c.aluno?.nome || "Aluno",
            valor: c.valor,
            vencimento: formatarData(c.data_vencimento),
          })),
          pagas_mes: painel.pagasMes.map((c) => ({
            id: c.id,
            aluno: c.aluno?.nome || "Aluno",
            valor: c.valor,
            forma: c.forma_pagamento,
          })),
          totais: painel.totais,
        };

        if (filtro === "atrasadas") {
          return {
            resultado: {
              atrasadas: cobrancasFiltradas.atrasadas,
              total_reais: cobrancasFiltradas.totais.totalAtrasado,
              quantidade: cobrancasFiltradas.totais.qtdAtrasado,
            },
          };
        }
        if (filtro === "hoje") {
          return {
            resultado: {
              hoje: cobrancasFiltradas.hoje,
              total_reais: cobrancasFiltradas.totais.totalHoje,
              quantidade: cobrancasFiltradas.totais.qtdHoje,
            },
          };
        }
        if (filtro === "proximas") {
          return {
            resultado: {
              proximas: cobrancasFiltradas.proximas,
              quantidade: cobrancasFiltradas.totais.qtdProximos7Dias,
            },
          };
        }
        if (filtro === "pagas") {
          return {
            resultado: {
              pagas: cobrancasFiltradas.pagas_mes,
              total_recebido: cobrancasFiltradas.totais.totalRecebidoMes,
              quantidade: cobrancasFiltradas.totais.qtdRecebidoMes,
            },
          };
        }

        return { resultado: cobrancasFiltradas };
      }

      // ----------------------------------------------------------------------
      // 7) MARCAR COBRANÇA PAGA
      // ----------------------------------------------------------------------
      case "marcar_cobranca_paga": {
        let cobrancaId = typeof args.cobranca_id === "string" ? args.cobranca_id : "";
        let alunoNome = typeof args.nome_aluno === "string" ? args.nome_aluno : "";

        if (!cobrancaId && alunoNome) {
          const painel = await listarPainelCobrancas();
          const todasPendentes = [...painel.atrasadas, ...painel.hoje, ...painel.proximos];
          const match = todasPendentes.find((c) =>
            (c.aluno?.nome || "").toLowerCase().includes(alunoNome.toLowerCase())
          );
          if (match) {
            cobrancaId = match.id;
            alunoNome = match.aluno?.nome || alunoNome;
          }
        }

        if (!cobrancaId) {
          return { resultado: { erro: "Não encontrei cobrança pendente para este aluno." } };
        }

        const formaPagamento =
          typeof args.forma_pagamento === "string" &&
          ["pix", "dinheiro", "cartao_credito", "cartao_debito", "outro"].includes(args.forma_pagamento)
            ? (args.forma_pagamento as "pix" | "dinheiro" | "cartao_credito" | "cartao_debito" | "outro")
            : "pix";

        const dataPagamento = typeof args.data_pagamento === "string" ? args.data_pagamento : dataHoje();

        const res = await marcarComoPago(cobrancaId, formaPagamento, dataPagamento);

        const sucesso = Boolean(res.ok);

        return {
          resultado: res,
          acao: {
            tipo: "pagamento",
            titulo: sucesso ? "Pagamento Registrado" : "Erro no Pagamento",
            detalhes: sucesso
              ? `Mensalidade de ${alunoNome || "Aluno"} marcada como paga via ${formaPagamento.toUpperCase()}. Próximo mês agendado automaticamente!`
              : res.error || "Erro ao registrar pagamento",
            sucesso,
          },
        };
      }

      // ----------------------------------------------------------------------
      // 8) CRIAR COBRANÇA AVULSA
      // ----------------------------------------------------------------------
      case "criar_cobranca_avulsa": {
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        let alunoNome = typeof args.nome_aluno === "string" ? args.nome_aluno : "";

        if (!alunoId && alunoNome) {
          const achou = await encontrarAlunoPorNomeOuId(alunoNome);
          if (achou) {
            alunoId = achou.id;
            alunoNome = achou.nome;
          }
        }

        if (!alunoId) {
          return { resultado: { erro: `Não encontrei o aluno "${alunoNome}".` } };
        }

        const valor = Number(args.valor);
        const dataVencimento = typeof args.data_vencimento === "string" ? args.data_vencimento : dataHoje();
        const titulo = typeof args.titulo === "string" && args.titulo ? args.titulo : "Cobrança avulsa";
        const observacao = typeof args.observacao === "string" ? args.observacao : "";

        const res = await criarCobrancaAvulsa({
          alunoId,
          titulo,
          valor,
          dataVencimento,
          observacao,
        });

        const sucesso = Boolean(res.ok);

        return {
          resultado: res,
          acao: {
            tipo: "cobranca_avulsa",
            titulo: sucesso ? "Cobrança Avulsa Criada" : "Erro ao Criar Cobrança",
            detalhes: sucesso
              ? `Cobrança de R$ ${valor.toFixed(2)} (${titulo}) lançada para ${alunoNome || "Aluno"}, vencimento em ${formatarData(dataVencimento)}.`
              : res.error || "Erro ao salvar",
            sucesso,
          },
        };
      }

      default:
        return { resultado: { erro: `Ferramenta desconhecida: ${nome}` } };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { resultado: { erro: `Falha ao executar ferramenta ${nome}: ${msg}` } };
  }
}

// ============================================================================
// LOOP PRINCIPAL DO AGENTE CLAUDE
// ============================================================================
export async function processarMensagemCopiloto(dados: {
  mensagem: string;
  historico?: MensagemChat[];
}): Promise<RespostaCopiloto> {
  const cliente = obterClienteClaude();
  if (!cliente) {
    return {
      ok: false,
      resposta:
        "⚠️ A chave de API do Claude (`ANTHROPIC_API_KEY`) ainda não foi configurada no `.env.local`. Por favor, adicione sua chave da Anthropic para habilitar o copiloto.",
      acoes: [],
      erro: "Chave não configurada",
    };
  }

  const hoje = dataHoje();
  const dow = diaDaSemana(hoje);
  const nomeDia = DIAS_SEMANA[dow];

  const systemPrompt = `Você é o Copiloto e Assistente Executivo do "Studio Brenno Mancini", um estúdio fitness personalizado.
Você opera o sistema diretamente a pedido do proprietário do estúdio.
Data de referência atual: ${hoje} (${nomeDia}, horário de Brasília).

DIRETRIZES DE COMPORTAMENTO:
1. Seja sempre direto, ágil, objetivo e empático. Responda em português brasileiro.
2. Você tem acesso a ferramentas reais para consultar e alterar a agenda, alunos e cobranças. USE-AS ativamente sempre que o pedido envolver dados ou ações no estúdio.
3. Ao agendar ou cancelar, se o usuário não informar a data explicitamente, use a data de hoje (${hoje}) ou o próximo dia adequado.
4. Quando uma ação for realizada com sucesso, confirme com clareza o que foi feito (ex.: "Agendei o Carlos para amanhã às 08h").
5. Formate valores monetários em padrão brasileiro (R$ 250,00) e datas em DD/MM/AAAA.
6. Nunca invente dados que você pode buscar com suas ferramentas. Se tiver dúvida sobre qual aluno é, use 'buscar_alunos'.`;

  const historicoFormatado = (dados.historico || []).slice(-8).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages: Anthropic.MessageParam[] = [
    ...historicoFormatado,
    { role: "user" as const, content: dados.mensagem },
  ];

  const acoesAcumuladas: AcaoExecutada[] = [];

  try {
    let respostaAtual = await cliente.messages.create({
      model: MODELO_PADRAO,
      max_tokens: 1024,
      system: systemPrompt,
      tools: FERRAMENTAS_COPILOTO,
      messages,
    });

    let iteracoes = 0;
    const MAX_ITERACOES = 4;

    // Loop de Tool Calling
    while (respostaAtual.stop_reason === "tool_use" && iteracoes < MAX_ITERACOES) {
      iteracoes++;
      const toolUseBlocks = respostaAtual.content.filter((b) => b.type === "tool_use");

      if (toolUseBlocks.length === 0) break;

      const toolResultsContent: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type === "tool_use") {
          const { resultado, acao } = await executarFerramenta(
            block.name,
            block.input as Record<string, unknown>
          );

          if (acao) acoesAcumuladas.push(acao);

          toolResultsContent.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(resultado),
          });
        }
      }

      // Adiciona a resposta do assistente e os resultados das tools ao contexto
      messages.push({
        role: "assistant",
        content: respostaAtual.content,
      });

      messages.push({
        role: "user",
        content: toolResultsContent,
      });

      // Chama o Claude novamente para formular a resposta final
      respostaAtual = await cliente.messages.create({
        model: MODELO_PADRAO,
        max_tokens: 1024,
        system: systemPrompt,
        tools: FERRAMENTAS_COPILOTO,
        messages,
      });
    }

    // Extrai o texto final gerado pelo Claude
    const textBlocks = respostaAtual.content.filter((b) => b.type === "text");
    const textoFinal = textBlocks.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();

    return {
      ok: true,
      resposta: textoFinal || "Ação concluída com sucesso.",
      acoes: acoesAcumuladas,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Erro no processarMensagemCopiloto:", err);
    return {
      ok: false,
      resposta: `Ocorreu um erro ao comunicar com a API do Claude: ${msg}`,
      acoes: acoesAcumuladas,
      erro: msg,
    };
  }
}
