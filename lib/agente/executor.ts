import Anthropic from "@anthropic-ai/sdk";
import { obterClienteClaude, obterModeloClaude } from "./anthropic";
import { FERRAMENTAS_COPILOTO } from "./ferramentas";
import {
  dataHoje,
  diaDaSemana,
  DIAS_SEMANA,
  formatarData,
  formatoHorario,
} from "@/lib/constantes";
import { carregarAgenda, alternarSuspensao } from "@/lib/services/agenda";
import { agendarAula, cancelarAgendamento } from "@/lib/services/agendamentos";
import {
  buscarAluno,
  criarAluno,
  atualizarAluno,
  alternarStatusAluno,
  removerAluno,
  listarAlunos,
  type DadosAluno,
} from "@/lib/services/alunos";
import {
  listarAulas,
  criarAula,
  atualizarAula,
  alternarAulaAtiva,
  removerAula,
} from "@/lib/services/aulas";
import {
  listarPainelCobrancas,
  marcarComoPago,
  desfazerPagamento,
  cancelarCobranca,
  criarCobrancaAvulsa,
  obterConfiguracoesCobranca,
  salvarConfiguracoesCobranca,
  type FormaPagamento,
} from "@/lib/services/cobrancas";
import { exigeDono } from "@/lib/exige-login";

export type MensagemChat = {
  role: "user" | "assistant";
  content: string;
};

export type AcaoExecutada = {
  tipo:
    | "aluno_cadastro"
    | "aluno_edicao"
    | "aluno_exclusao"
    | "aula_criacao"
    | "aula_edicao"
    | "aula_exclusao"
    | "agendamento"
    | "cancelamento"
    | "suspensao"
    | "troca_horario"
    | "pagamento"
    | "cobranca_avulsa"
    | "cobranca_edicao"
    | "cobranca_cancelamento"
    | "configuracao"
    | "consulta";
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

  // Se já for um UUID válido
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identificador
    )
  ) {
    const { data } = await supabase
      .from("alunos")
      .select("id, nome, telefone, status, valor_mensalidade, dia_vencimento")
      .eq("id", identificador)
      .maybeSingle();
    if (data) return data;
  }

  // Busca por nome aproximado
  const termo = identificador.trim().toLowerCase();
  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome, telefone, status, valor_mensalidade, dia_vencimento");
  if (!alunos || alunos.length === 0) return null;

  const exato = alunos.find((a) => a.nome.toLowerCase() === termo);
  if (exato) return exato;

  const prefixo = alunos.find((a) => a.nome.toLowerCase().startsWith(termo));
  if (prefixo) return prefixo;

  const contido = alunos.find((a) => a.nome.toLowerCase().includes(termo));
  if (contido) return contido;

  return null;
}

async function encontrarAulaPorHorarioOuId(
  aulaId?: string,
  horario?: string,
  diaSemana?: number
) {
  const supabase = await exigeDono();

  if (
    aulaId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      aulaId
    )
  ) {
    const { data } = await supabase
      .from("aulas")
      .select("id, tipo_aula, dia_semana, horario, limite_vagas, ativo")
      .eq("id", aulaId)
      .maybeSingle();
    if (data) return data;
  }

  if (horario) {
    const horaFormatada = horario.slice(0, 5);
    const { data: aulas } = await supabase
      .from("aulas")
      .select("id, tipo_aula, dia_semana, horario, limite_vagas, ativo");
    if (!aulas) return null;

    if (diaSemana !== undefined) {
      const match = aulas.find(
        (a) =>
          a.dia_semana === diaSemana && a.horario.slice(0, 5) === horaFormatada
      );
      if (match) return match;
    }

    const matchHora = aulas.find((a) => a.horario.slice(0, 5) === horaFormatada);
    if (matchHora) return matchHora;
  }

  return null;
}

// ============================================================================
// EXECUTOR DE FERRAMENTAS DO CLAUDE (ACESSO TOTAL À APLICAÇÃO)
// ============================================================================
export async function executarFerramenta(
  nome: string,
  args: Record<string, unknown>
): Promise<{ resultado: unknown; acao?: AcaoExecutada }> {
  try {
    const supabase = await exigeDono();

    switch (nome) {
      // ======================================================================
      // 1) GESTÃO DE ALUNOS
      // ======================================================================
      case "buscar_alunos": {
        const termo = typeof args.termo === "string" ? args.termo.trim() : "";
        const filtro = (args.filtro as string) || "ativos";

        const lista = await listarAlunos();
        let filtrados = lista;

        if (filtro === "ativos") {
          filtrados = filtrados.filter((a) => a.status === "ativo");
        } else if (filtro === "inativos") {
          filtrados = filtrados.filter((a) => a.status === "inativo");
        }

        if (termo) {
          const t = termo.toLowerCase();
          filtrados = filtrados.filter((a) => a.nome.toLowerCase().includes(t));
        }

        return {
          resultado: {
            total: filtrados.length,
            alunos: filtrados.map((a) => {
              const raw = a as Record<string, unknown>;
              return {
                id: a.id,
                nome: a.nome,
                telefone: a.telefone || "Sem telefone",
                status: a.status,
                dores: raw.tem_dores_cronicas ? "Sim" : "Não",
                profissao: (raw.profissao as string) || null,
              };
            }),
          },
        };
      }

      case "obter_ficha_aluno": {
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achado = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achado) alunoId = achado.id;
        }

        if (!alunoId) {
          return { resultado: { erro: "Aluno não localizado no sistema." } };
        }

        const ficha = await buscarAluno(alunoId);
        if (!ficha) {
          return { resultado: { erro: "Ficha do aluno não encontrada." } };
        }

        const painel = await listarPainelCobrancas();
        const cobrancasAluno = [
          ...painel.atrasadas,
          ...painel.hoje,
          ...painel.proximos,
          ...painel.pagasMes,
        ].filter((c) => c.aluno_id === alunoId);

        return {
          resultado: {
            aluno: ficha,
            cobrancas_recentes: cobrancasAluno.map((c) => ({
              id: c.id,
              titulo: c.titulo,
              valor: c.valor,
              vencimento: formatarData(c.data_vencimento),
              status: c.status,
            })),
          },
        };
      }

      case "cadastrar_aluno": {
        const nome = String(args.nome || "").trim();
        if (!nome) {
          return { resultado: { erro: "O nome do aluno é obrigatório." } };
        }

        const dados: DadosAluno = {
          nome,
          telefone: String(args.telefone || "").trim(),
          observacoes: String(args.observacoes || "").trim(),
          status: (args.status as "ativo" | "inativo") || "ativo",
          data_nascimento:
            typeof args.data_nascimento === "string" && args.data_nascimento
              ? args.data_nascimento
              : null,
          profissao: String(args.profissao || "").trim(),
          tem_empresa: Boolean(args.tem_empresa),
          empresa_nome: String(args.empresa_nome || "").trim(),
          empresa_ramo: String(args.empresa_ramo || "").trim(),
          tem_dores_cronicas: Boolean(args.tem_dores_cronicas),
          dores_cronicas_descricao: String(
            args.dores_cronicas_descricao || ""
          ).trim(),
          lesoes: String(args.lesoes || "").trim(),
          estilo_treino: String(args.estilo_treino || "").trim(),
          descricao_aluno: "",
          valor_mensalidade:
            typeof args.valor_mensalidade === "number"
              ? args.valor_mensalidade
              : null,
          dia_vencimento:
            typeof args.dia_vencimento === "number"
              ? args.dia_vencimento
              : null,
          periodicidade:
            args.periodicidade === "trimestral" ? "trimestral" : "mensal",
        };

        const res = await criarAluno(dados);
        if (res.error) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "aluno_cadastro",
              titulo: "Erro ao cadastrar aluno",
              detalhes: `${nome}: ${res.error}`,
              sucesso: false,
            },
          };
        }

        return {
          resultado: { ok: true, aluno_id: res.id, nome },
          acao: {
            tipo: "aluno_cadastro",
            titulo: "Aluno Cadastrado com Sucesso",
            detalhes: `${nome} foi registrado no estúdio (Mensalidade: R$ ${dados.valor_mensalidade || 0}, Vencimento dia ${dados.dia_vencimento || "-"}).`,
            sucesso: true,
          },
        };
      }

      case "atualizar_aluno": {
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achado = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achado) alunoId = achado.id;
        }

        if (!alunoId) {
          return { resultado: { erro: "Aluno não informado ou não encontrado." } };
        }

        const atual = await buscarAluno(alunoId);
        if (!atual) {
          return { resultado: { erro: "Aluno não encontrado no banco." } };
        }

        const novosDados: DadosAluno = {
          nome: args.nome !== undefined ? String(args.nome).trim() : atual.nome,
          telefone:
            args.telefone !== undefined
              ? String(args.telefone).trim()
              : atual.telefone,
          observacoes:
            args.observacoes !== undefined
              ? String(args.observacoes).trim()
              : atual.observacoes,
          status:
            args.status !== undefined
              ? (args.status as "ativo" | "inativo")
              : atual.status,
          data_nascimento:
            args.data_nascimento !== undefined
              ? String(args.data_nascimento)
              : atual.data_nascimento,
          profissao:
            args.profissao !== undefined
              ? String(args.profissao)
              : atual.profissao,
          tem_empresa:
            args.tem_empresa !== undefined
              ? Boolean(args.tem_empresa)
              : atual.tem_empresa,
          empresa_nome:
            args.empresa_nome !== undefined
              ? String(args.empresa_nome)
              : atual.empresa_nome,
          empresa_ramo:
            args.empresa_ramo !== undefined
              ? String(args.empresa_ramo)
              : atual.empresa_ramo,
          tem_dores_cronicas:
            args.tem_dores_cronicas !== undefined
              ? Boolean(args.tem_dores_cronicas)
              : atual.tem_dores_cronicas,
          dores_cronicas_descricao:
            args.dores_cronicas_descricao !== undefined
              ? String(args.dores_cronicas_descricao)
              : atual.dores_cronicas_descricao,
          lesoes:
            args.lesoes !== undefined ? String(args.lesoes) : atual.lesoes,
          estilo_treino:
            args.estilo_treino !== undefined
              ? String(args.estilo_treino)
              : atual.estilo_treino,
          descricao_aluno: atual.descricao_aluno,
          valor_mensalidade:
            args.valor_mensalidade !== undefined
              ? Number(args.valor_mensalidade)
              : atual.valor_mensalidade,
          dia_vencimento:
            args.dia_vencimento !== undefined
              ? Number(args.dia_vencimento)
              : atual.dia_vencimento,
          periodicidade:
            args.periodicidade !== undefined
              ? (args.periodicidade as "mensal" | "trimestral")
              : atual.periodicidade,
        };

        const res = await atualizarAluno(alunoId, novosDados);
        if (res.error) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "aluno_edicao",
              titulo: "Erro ao atualizar aluno",
              detalhes: `${atual.nome}: ${res.error}`,
              sucesso: false,
            },
          };
        }

        return {
          resultado: { ok: true, aluno_id: alunoId, dados: novosDados },
          acao: {
            tipo: "aluno_edicao",
            titulo: "Dados do Aluno Atualizados",
            detalhes: `Ficha de ${novosDados.nome} atualizada com sucesso.`,
            sucesso: true,
          },
        };
      }

      case "alternar_status_aluno": {
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achado = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achado) alunoId = achado.id;
        }

        if (!alunoId) {
          return { resultado: { erro: "Aluno não encontrado." } };
        }

        const atual = await buscarAluno(alunoId);
        if (!atual) {
          return { resultado: { erro: "Aluno não encontrado." } };
        }

        const novoStatus: "ativo" | "inativo" =
          (args.novo_status as "ativo" | "inativo") ||
          (atual.status === "ativo" ? "inativo" : "ativo");

        await alternarStatusAluno(alunoId, atual.status);

        return {
          resultado: { ok: true, aluno_id: alunoId, status: novoStatus },
          acao: {
            tipo: "aluno_edicao",
            titulo: `Aluno ${novoStatus === "ativo" ? "Reativado" : "Inativado"}`,
            detalhes: `${atual.nome} agora está marcado como ${novoStatus}.`,
            sucesso: true,
          },
        };
      }

      case "excluir_aluno": {
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achado = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achado) alunoId = achado.id;
        }

        if (!alunoId) {
          return { resultado: { erro: "Aluno não encontrado para exclusão." } };
        }

        const atual = await buscarAluno(alunoId);
        const nomeAluno = atual?.nome || "Aluno";

        await removerAluno(alunoId);

        return {
          resultado: { ok: true, aluno_removido: nomeAluno },
          acao: {
            tipo: "aluno_exclusao",
            titulo: "Aluno Removido",
            detalhes: `${nomeAluno} foi excluído do sistema do estúdio.`,
            sucesso: true,
          },
        };
      }

      // ======================================================================
      // 2) GESTÃO DE AULAS E GRADE SEMANAL
      // ======================================================================
      case "listar_grade_aulas": {
        const todasAulas = await listarAulas();
        const diaFiltrado =
          typeof args.dia_semana === "number" ? args.dia_semana : null;
        const somenteAtivas = Boolean(args.somente_ativas);

        let filtradas = todasAulas;
        if (somenteAtivas) {
          filtradas = filtradas.filter((a) => a.ativo);
        }
        if (diaFiltrado !== null) {
          filtradas = filtradas.filter((a) => a.dia_semana === diaFiltrado);
        }

        return {
          resultado: {
            total: filtradas.length,
            grade: filtradas.map((a) => ({
              id: a.id,
              dia_semana: DIAS_SEMANA[a.dia_semana],
              horario: formatoHorario(a.horario),
              tipo_aula: a.tipo_aula,
              limite_vagas: a.limite_vagas,
              ativo: a.ativo,
            })),
          },
        };
      }

      case "criar_aula": {
        const tipo_aula = String(args.tipo_aula || "").trim();
        const dia_semana = Number(args.dia_semana);
        const horario = String(args.horario || "").trim();
        const limite_vagas = Number(args.limite_vagas || 4);

        if (!tipo_aula || isNaN(dia_semana) || !horario) {
          return {
            resultado: { erro: "Preencha tipo de aula, dia da semana e horário." },
          };
        }

        const res = await criarAula({
          tipo_aula,
          dia_semana,
          horario: horario.length === 5 ? `${horario}:00` : horario,
          limite_vagas,
        });

        if (res.error) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "aula_criacao",
              titulo: "Erro ao criar horário na grade",
              detalhes: res.error,
              sucesso: false,
            },
          };
        }

        const nomeDia = DIAS_SEMANA[dia_semana];
        return {
          resultado: { ok: true, tipo_aula, dia: nomeDia, horario, limite_vagas },
          acao: {
            tipo: "aula_criacao",
            titulo: "Novo Horário Adicionado na Grade",
            detalhes: `${tipo_aula} às ${horario} (${nomeDia}) com limite de ${limite_vagas} vagas.`,
            sucesso: true,
          },
        };
      }

      case "atualizar_aula": {
        const aulaId = String(args.aula_id || "");
        if (!aulaId) {
          return { resultado: { erro: "ID da aula é obrigatório." } };
        }

        const { data: aulaAtual } = await supabase
          .from("aulas")
          .select("*")
          .eq("id", aulaId)
          .single();

        if (!aulaAtual) {
          return { resultado: { erro: "Aula não encontrada no banco." } };
        }

        const dadosNovos = {
          tipo_aula:
            args.tipo_aula !== undefined
              ? String(args.tipo_aula).trim()
              : aulaAtual.tipo_aula,
          dia_semana:
            args.dia_semana !== undefined
              ? Number(args.dia_semana)
              : aulaAtual.dia_semana,
          horario:
            args.horario !== undefined
              ? String(args.horario).length === 5
                ? `${args.horario}:00`
                : String(args.horario)
              : aulaAtual.horario,
          limite_vagas:
            args.limite_vagas !== undefined
              ? Number(args.limite_vagas)
              : aulaAtual.limite_vagas,
        };

        const res = await atualizarAula(aulaId, dadosNovos);
        if (res.error) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "aula_edicao",
              titulo: "Erro ao editar aula",
              detalhes: res.error,
              sucesso: false,
            },
          };
        }

        return {
          resultado: { ok: true, dados: dadosNovos },
          acao: {
            tipo: "aula_edicao",
            titulo: "Horário da Grade Atualizado",
            detalhes: `${dadosNovos.tipo_aula} (${DIAS_SEMANA[dadosNovos.dia_semana]} às ${formatoHorario(dadosNovos.horario)} - ${dadosNovos.limite_vagas} vagas).`,
            sucesso: true,
          },
        };
      }

      case "alternar_aula_ativa": {
        const aulaId = String(args.aula_id || "");
        const ativa = Boolean(args.ativa);

        await alternarAulaAtiva(aulaId, !ativa);

        return {
          resultado: { ok: true, aula_id: aulaId, ativa },
          acao: {
            tipo: "aula_edicao",
            titulo: `Aula ${ativa ? "Ativada" : "Desativada"}`,
            detalhes: `A aula foi marcada como ${ativa ? "ativa" : "inativa"} na grade.`,
            sucesso: true,
          },
        };
      }

      case "excluir_aula": {
        const aulaId = String(args.aula_id || "");
        await removerAula(aulaId);

        return {
          resultado: { ok: true, aula_id: aulaId },
          acao: {
            tipo: "aula_exclusao",
            titulo: "Aula Excluída da Grade",
            detalhes: "O horário foi removido da grade semanal do estúdio.",
            sucesso: true,
          },
        };
      }

      // ======================================================================
      // 3) GESTÃO DE AGENDA, AGENDAMENTOS E SUSPENSÕES
      // ======================================================================
      case "consultar_agenda": {
        const dataAlvo =
          typeof args.data === "string" && args.data ? args.data : dataHoje();
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
            return al ? al.nome : "Aluno";
          });

          return {
            aula_id: aula.id,
            horario: formatoHorario(aula.horario),
            tipo_aula: aula.tipo_aula,
            limite_vagas: aula.limite_vagas,
            ocupadas: inscritos.length,
            vagas_restantes: Math.max(0, aula.limite_vagas - inscritos.length),
            suspensa,
            alunos: inscritos,
          };
        });

        return {
          resultado: {
            data: dataAlvo,
            data_formatada: formatarData(dataAlvo),
            dia_semana: nomeDia,
            total_aulas: grade.length,
            aulas: grade,
          },
        };
      }

      case "agendar_aluno": {
        const dataAlvo =
          typeof args.data === "string" && args.data ? args.data : dataHoje();
        const dow = diaDaSemana(dataAlvo);

        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        let nomeAluno = "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const aluno = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (aluno) {
            alunoId = aluno.id;
            nomeAluno = aluno.nome;
          }
        }

        if (!alunoId) {
          return { resultado: { erro: "Aluno não identificado para o agendamento." } };
        }

        let aulaId = typeof args.aula_id === "string" ? args.aula_id : "";
        let horarioFormatado = "";
        let tipoAula = "";

        if (!aulaId && typeof args.horario === "string") {
          const aula = await encontrarAulaPorHorarioOuId(
            undefined,
            args.horario,
            dow
          );
          if (aula) {
            aulaId = aula.id;
            horarioFormatado = formatoHorario(aula.horario);
            tipoAula = aula.tipo_aula;
          }
        }

        if (!aulaId) {
          return {
            resultado: {
              erro: `Nenhuma aula encontrada para o horário informado no dia ${formatarData(dataAlvo)} (${DIAS_SEMANA[dow]}).`,
            },
          };
        }

        const res = await agendarAula(aulaId, alunoId, dataAlvo);
        if (res.error) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "agendamento",
              titulo: "Falha ao Agendar",
              detalhes: `${nomeAluno || "Aluno"}: ${res.error}`,
              sucesso: false,
            },
          };
        }

        return {
          resultado: {
            ok: true,
            aluno: nomeAluno,
            data: formatarData(dataAlvo),
            horario: horarioFormatado,
            tipo_aula: tipoAula,
          },
          acao: {
            tipo: "agendamento",
            titulo: "Agendamento Confirmado",
            detalhes: `${nomeAluno || "Aluno"} agendado com sucesso para ${formatarData(dataAlvo)} às ${horarioFormatado || "horário da aula"}.`,
            sucesso: true,
          },
        };
      }

      case "cancelar_agendamento": {
        const dataAlvo =
          typeof args.data === "string" && args.data ? args.data : dataHoje();
        const dow = diaDaSemana(dataAlvo);

        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        let nomeAluno = "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const aluno = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (aluno) {
            alunoId = aluno.id;
            nomeAluno = aluno.nome;
          }
        }

        let aulaId = typeof args.aula_id === "string" ? args.aula_id : "";
        if (!aulaId && typeof args.horario === "string") {
          const aula = await encontrarAulaPorHorarioOuId(
            undefined,
            args.horario,
            dow
          );
          if (aula) aulaId = aula.id;
        }

        if (!alunoId || !aulaId) {
          return {
            resultado: {
              erro: "Informe o aluno e o horário da aula para cancelar.",
            },
          };
        }

        const res = await cancelarAgendamento(aulaId, alunoId, dataAlvo);
        if (res.error) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "cancelamento",
              titulo: "Erro ao Desmarcar",
              detalhes: res.error,
              sucesso: false,
            },
          };
        }

        return {
          resultado: { ok: true, data: formatarData(dataAlvo) },
          acao: {
            tipo: "cancelamento",
            titulo: "Presença Cancelada",
            detalhes: `${nomeAluno || "Aluno"} foi desmarcado da aula em ${formatarData(dataAlvo)}. Vaga liberada.`,
            sucesso: true,
          },
        };
      }

      case "suspender_aula": {
        const dataAlvo = String(args.data || dataHoje());
        const dow = diaDaSemana(dataAlvo);

        let aulaId = String(args.aula_id || "");
        if (!aulaId && typeof args.horario === "string") {
          const aula = await encontrarAulaPorHorarioOuId(
            undefined,
            args.horario,
            dow
          );
          if (aula) aulaId = aula.id;
        }

        if (!aulaId) {
          return { resultado: { erro: "Aula não encontrada para suspensão." } };
        }

        const res = await alternarSuspensao(aulaId, dataAlvo, false);
        if (res.error) {
          return { resultado: { erro: res.error } };
        }

        return {
          resultado: { ok: true, data: dataAlvo },
          acao: {
            tipo: "suspensao",
            titulo: "Aula Suspensa na Data",
            detalhes: `A aula foi suspensa em ${formatarData(dataAlvo)} sem alterar a grade semanal.`,
            sucesso: true,
          },
        };
      }

      case "reativar_aula_suspensa": {
        const dataAlvo = String(args.data || dataHoje());
        const dow = diaDaSemana(dataAlvo);

        let aulaId = String(args.aula_id || "");
        if (!aulaId && typeof args.horario === "string") {
          const aula = await encontrarAulaPorHorarioOuId(
            undefined,
            args.horario,
            dow
          );
          if (aula) aulaId = aula.id;
        }

        if (!aulaId) {
          return { resultado: { erro: "Aula não encontrada para reativação." } };
        }

        const res = await alternarSuspensao(aulaId, dataAlvo, true);
        if (res.error) {
          return { resultado: { erro: res.error } };
        }

        return {
          resultado: { ok: true, data: dataAlvo },
          acao: {
            tipo: "suspensao",
            titulo: "Aula Reativada na Data",
            detalhes: `A suspensão da aula em ${formatarData(dataAlvo)} foi removida.`,
            sucesso: true,
          },
        };
      }

      case "trocar_horario_aluno": {
        const dataAlvo = String(args.data || dataHoje());
        const dow = diaDaSemana(dataAlvo);

        let alunoId = String(args.aluno_id || "");
        let nomeAluno = "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const al = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (al) {
            alunoId = al.id;
            nomeAluno = al.nome;
          }
        }

        const aulaOrigem = await encontrarAulaPorHorarioOuId(
          undefined,
          String(args.horario_origem || ""),
          dow
        );
        const aulaDestino = await encontrarAulaPorHorarioOuId(
          undefined,
          String(args.horario_destino || ""),
          dow
        );

        if (!alunoId || !aulaOrigem || !aulaDestino) {
          return {
            resultado: {
              erro: "Dados insuficientes: aluno ou horários não encontrados.",
            },
          };
        }

        // Desmarca da aula de origem
        await cancelarAgendamento(aulaOrigem.id, alunoId, dataAlvo);
        // Agenda na aula de destino
        const resAgenda = await agendarAula(aulaDestino.id, alunoId, dataAlvo);

        if (resAgenda.error) {
          // Rollback se falhar
          await agendarAula(aulaOrigem.id, alunoId, dataAlvo);
          return {
            resultado: { erro: `Erro ao agendar no novo horário: ${resAgenda.error}` },
          };
        }

        return {
          resultado: { ok: true, de: args.horario_origem, para: args.horario_destino },
          acao: {
            tipo: "troca_horario",
            titulo: "Aluno Transferido de Horário",
            detalhes: `${nomeAluno || "Aluno"} transferido de ${args.horario_origem} para ${args.horario_destino} em ${formatarData(dataAlvo)}.`,
            sucesso: true,
          },
        };
      }

      // ======================================================================
      // 4) GESTÃO DE COBRANÇAS E FINANCEIRO
      // ======================================================================
      case "consultar_cobrancas": {
        const filtro = (args.filtro as string) || "todas";
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achado = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achado) alunoId = achado.id;
        }

        const painel = await listarPainelCobrancas();
        let lista: typeof painel.atrasadas = [];

        if (filtro === "atrasadas") lista = painel.atrasadas;
        else if (filtro === "hoje") lista = painel.hoje;
        else if (filtro === "proximas") lista = painel.proximos;
        else if (filtro === "pagas") lista = painel.pagasMes;
        else {
          lista = [
            ...painel.atrasadas,
            ...painel.hoje,
            ...painel.proximos,
            ...painel.pagasMes,
          ];
        }

        if (alunoId) {
          lista = lista.filter((c) => c.aluno_id === alunoId);
        }

        return {
          resultado: {
            total: lista.length,
            cobrancas: lista.map((c) => ({
              id: c.id,
              aluno: c.aluno?.nome || "Aluno",
              telefone: c.aluno?.telefone || "",
              titulo: c.titulo,
              valor: c.valor,
              vencimento: formatarData(c.data_vencimento),
              status: c.status,
              forma_pagamento: c.forma_pagamento || null,
            })),
          },
        };
      }

      case "resumo_financeiro": {
        const painel = await listarPainelCobrancas();
        return {
          resultado: {
            faturamento_recebido_mes: `R$ ${painel.totais.totalRecebidoMes.toFixed(2)}`,
            qtd_pagamentos_mes: painel.totais.qtdRecebidoMes,
            total_em_atraso: `R$ ${painel.totais.totalAtrasado.toFixed(2)}`,
            qtd_inadimplentes: painel.totais.qtdAtrasado,
            vencendo_hoje: `R$ ${painel.totais.totalHoje.toFixed(2)} (${painel.totais.qtdHoje} alunos)`,
            proximos_7_dias: `${painel.totais.qtdProximos7Dias} mensalidades`,
          },
        };
      }

      case "marcar_cobranca_paga": {
        let cobrancaId = typeof args.cobranca_id === "string" ? args.cobranca_id : "";
        let nomeAluno = "";

        if (!cobrancaId && typeof args.nome_aluno === "string") {
          const painel = await listarPainelCobrancas();
          const termo = args.nome_aluno.toLowerCase();
          const cobrancaEncontrada = [
            ...painel.atrasadas,
            ...painel.hoje,
            ...painel.proximos,
          ].find((c) => c.aluno?.nome?.toLowerCase().includes(termo));

          if (cobrancaEncontrada) {
            cobrancaId = cobrancaEncontrada.id;
            nomeAluno = cobrancaEncontrada.aluno?.nome || "";
          }
        }

        if (!cobrancaId) {
          return {
            resultado: {
              erro: "Cobrança pendente não encontrada para dar baixa.",
            },
          };
        }

        const forma = (args.forma_pagamento as FormaPagamento) || "pix";
        const dataPag =
          typeof args.data_pagamento === "string" && args.data_pagamento
            ? args.data_pagamento
            : dataHoje();

        const res = await marcarComoPago(cobrancaId, forma, dataPag);
        if (!res.ok) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "pagamento",
              titulo: "Erro na Baixa de Pagamento",
              detalhes: res.error || "Falha ao processar",
              sucesso: false,
            },
          };
        }

        return {
          resultado: {
            ok: true,
            cobranca_id: cobrancaId,
            aluno: nomeAluno,
            forma_pagamento: forma,
            proxima_gerada: Boolean(res.novaCobrancaId),
          },
          acao: {
            tipo: "pagamento",
            titulo: "Pagamento Confirmado",
            detalhes: `Baixa realizada (${forma.toUpperCase()}) para ${nomeAluno || "aluno"}. Próximo ciclo renovado automaticamente.`,
            sucesso: true,
          },
        };
      }

      case "desfazer_pagamento": {
        let cobrancaId = String(args.cobranca_id || "");
        if (!cobrancaId && typeof args.nome_aluno === "string") {
          const painel = await listarPainelCobrancas();
          const termo = args.nome_aluno.toLowerCase();
          const paga = painel.pagasMes.find((c) =>
            c.aluno?.nome?.toLowerCase().includes(termo)
          );
          if (paga) cobrancaId = paga.id;
        }

        if (!cobrancaId) {
          return { resultado: { erro: "Cobrança paga não encontrada para estorno." } };
        }

        const res = await desfazerPagamento(cobrancaId);
        if (!res.ok) {
          return { resultado: { erro: res.error } };
        }

        return {
          resultado: { ok: true, cobranca_id: cobrancaId },
          acao: {
            tipo: "pagamento",
            titulo: "Pagamento Estornado",
            detalhes: "A cobrança voltou para o status pendente e a cobrança futura duplicada foi limpa.",
            sucesso: true,
          },
        };
      }

      case "criar_cobranca_avulsa": {
        let alunoId = typeof args.aluno_id === "string" ? args.aluno_id : "";
        let nomeAluno = "";
        if (!alunoId && typeof args.nome_aluno === "string") {
          const achado = await encontrarAlunoPorNomeOuId(args.nome_aluno);
          if (achado) {
            alunoId = achado.id;
            nomeAluno = achado.nome;
          }
        }

        if (!alunoId) {
          return {
            resultado: { erro: "Aluno não identificado para a cobrança avulsa." },
          };
        }

        const valor = Number(args.valor);
        const dataVenc = String(args.data_vencimento || dataHoje());
        const titulo = String(args.titulo || "Cobrança Avulsa").trim();
        const obs = String(args.observacao || "").trim();

        const res = await criarCobrancaAvulsa({
          alunoId: alunoId,
          titulo,
          valor,
          dataVencimento: dataVenc,
          observacao: obs,
        });

        if (!res.ok) {
          return {
            resultado: { erro: res.error },
            acao: {
              tipo: "cobranca_avulsa",
              titulo: "Erro ao Gerar Cobrança",
              detalhes: res.error || "Erro",
              sucesso: false,
            },
          };
        }

        return {
          resultado: { ok: true, id: res.id, valor, titulo },
          acao: {
            tipo: "cobranca_avulsa",
            titulo: "Cobrança Avulsa Criada",
            detalhes: `${titulo} no valor de R$ ${valor.toFixed(2)} para ${nomeAluno || "aluno"} com vencimento em ${formatarData(dataVenc)}.`,
            sucesso: true,
          },
        };
      }

      case "atualizar_cobranca": {
        let cobrancaId = String(args.cobranca_id || "");
        if (!cobrancaId && typeof args.nome_aluno === "string") {
          const painel = await listarPainelCobrancas();
          const termo = args.nome_aluno.toLowerCase();
          const match = [
            ...painel.atrasadas,
            ...painel.hoje,
            ...painel.proximos,
          ].find((c) => c.aluno?.nome?.toLowerCase().includes(termo));
          if (match) cobrancaId = match.id;
        }

        if (!cobrancaId) {
          return { resultado: { erro: "Cobrança não encontrada para edição." } };
        }

        const updates: Record<string, unknown> = {};
        if (args.valor !== undefined) updates.valor = Number(args.valor);
        if (args.data_vencimento !== undefined)
          updates.data_vencimento = String(args.data_vencimento);
        if (args.titulo !== undefined) updates.titulo = String(args.titulo).trim();
        if (args.observacao !== undefined)
          updates.observacao = String(args.observacao).trim();

        const { error } = await supabase
          .from("cobrancas")
          .update(updates)
          .eq("id", cobrancaId);

        if (error) {
          return { resultado: { erro: error.message } };
        }

        return {
          resultado: { ok: true, cobranca_id: cobrancaId, alteracoes: updates },
          acao: {
            tipo: "cobranca_edicao",
            titulo: "Cobrança Atualizada",
            detalhes: `Valores ou prazos da cobrança foram alterados com sucesso.`,
            sucesso: true,
          },
        };
      }

      case "cancelar_cobranca":
      case "excluir_cobranca": {
        let cobrancaId = String(args.cobranca_id || "");
        if (!cobrancaId && typeof args.nome_aluno === "string") {
          const painel = await listarPainelCobrancas();
          const termo = args.nome_aluno.toLowerCase();
          const match = [
            ...painel.atrasadas,
            ...painel.hoje,
            ...painel.proximos,
          ].find((c) => c.aluno?.nome?.toLowerCase().includes(termo));
          if (match) cobrancaId = match.id;
        }

        if (!cobrancaId) {
          return { resultado: { erro: "Cobrança não encontrada para cancelamento/exclusão." } };
        }

        const res = await cancelarCobranca(cobrancaId);
        if (!res.ok) {
          return { resultado: { erro: res.error } };
        }

        return {
          resultado: { ok: true, cobranca_id: cobrancaId },
          acao: {
            tipo: "cobranca_cancelamento",
            titulo: "Cobrança Excluída / Cancelada",
            detalhes: "A cobrança foi removida do painel com sucesso e não será recriada automaticamente.",
            sucesso: true,
          },
        };
      }

      case "obter_configuracoes_cobranca": {
        const config = await obterConfiguracoesCobranca();
        return {
          resultado: {
            chave_pix: config.chave_pix || "Não configurada",
            studio_nome: config.studio_nome,
            mensagem_antecipada: config.msg_antecipada,
            mensagem_hoje: config.msg_hoje,
            mensagem_atraso: config.msg_atraso,
          },
        };
      }

      case "atualizar_configuracoes_cobranca": {
        const atual = await obterConfiguracoesCobranca();
        const novaConfig = {
          chave_pix:
            args.chave_pix !== undefined
              ? String(args.chave_pix).trim()
              : atual.chave_pix,
          studio_nome:
            args.studio_nome !== undefined
              ? String(args.studio_nome).trim()
              : atual.studio_nome,
          msg_antecipada:
            args.msg_antecipada !== undefined
              ? String(args.msg_antecipada)
              : atual.msg_antecipada,
          msg_hoje:
            args.msg_hoje !== undefined
              ? String(args.msg_hoje)
              : atual.msg_hoje,
          msg_atraso:
            args.msg_atraso !== undefined
              ? String(args.msg_atraso)
              : atual.msg_atraso,
        };

        const res = await salvarConfiguracoesCobranca(novaConfig);
        if (!res.ok) {
          return { resultado: { erro: res.error } };
        }

        return {
          resultado: { ok: true, config: novaConfig },
          acao: {
            tipo: "configuracao",
            titulo: "Configurações de Cobrança Atualizadas",
            detalhes: `Chave PIX e parâmetros do estúdio salvos com sucesso.`,
            sucesso: true,
          },
        };
      }

      // ======================================================================
      // 5) VISÃO GERAL 360° DO ESTÚDIO
      // ======================================================================
      case "obter_visao_geral_estudio": {
        const hojeStr = dataHoje();
        const dow = diaDaSemana(hojeStr);

        const [alunos, agenda, painel] = await Promise.all([
          listarAlunos(),
          carregarAgenda(),
          listarPainelCobrancas(),
        ]);

        const alunosAtivos = alunos.filter((a) => a.status === "ativo").length;
        const aulasHoje = agenda.aulas.filter((a) => a.dia_semana === dow);
        const agendamentosHoje = agenda.agendamentos.filter(
          (ag) => ag.data === hojeStr
        );

        return {
          resultado: {
            data: formatarData(hojeStr),
            dia_semana: DIAS_SEMANA[dow],
            alunos: {
              total_ativos: alunosAtivos,
              total_inativos: alunos.length - alunosAtivos,
            },
            agenda_hoje: {
              total_aulas: aulasHoje.length,
              total_agendamentos: agendamentosHoje.length,
            },
            financeiro: {
              recebido_mes: `R$ ${painel.totais.totalRecebidoMes.toFixed(2)}`,
              atrasado: `R$ ${painel.totais.totalAtrasado.toFixed(2)} (${painel.totais.qtdAtrasado} alunos)`,
              vencendo_hoje: `R$ ${painel.totais.totalHoje.toFixed(2)} (${painel.totais.qtdHoje} alunos)`,
            },
            alertas: [
              ...(painel.totais.qtdAtrasado > 0
                ? [
                    `${painel.totais.qtdAtrasado} mensalidade(s) atrasada(s) totalizando R$ ${painel.totais.totalAtrasado.toFixed(2)}`,
                  ]
                : []),
              ...(painel.totais.qtdHoje > 0
                ? [
                    `${painel.totais.qtdHoje} mensalidade(s) vencem hoje totalizando R$ ${painel.totais.totalHoje.toFixed(2)}`,
                  ]
                : []),
            ],
          },
        };
      }

      default:
        return {
          resultado: { erro: `Ferramenta desconhecida: ${nome}` },
        };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Erro ao executar ferramenta ${nome}:`, err);
    return {
      resultado: { erro: `Falha interna na execução: ${msg}` },
      acao: {
        tipo: "consulta",
        titulo: `Erro ao executar ${nome}`,
        detalhes: msg,
        sucesso: false,
      },
    };
  }
}

// ============================================================================
// LOOP PRINCIPAL DO AGENTE CLAUDE COM AUTORIDADE TOTAL NO ESTÚDIO
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

  const anthropic = cliente;
  const hoje = dataHoje();
  const dow = diaDaSemana(hoje);
  const nomeDia = DIAS_SEMANA[dow];

  const systemPrompt = `Você é o Copiloto e Assistente Executivo com AUTORIDADE TOTAL sobre o sistema do "Studio Brenno Mancini", um estúdio fitness personalizado.
Você opera o estúdio diretamente a pedido do proprietário (Brenno).
Data de referência atual: ${hoje} (${nomeDia}, horário de Brasília).

AUTORIDADE E ACESSO TOTAL:
Você tem acesso completo para LER e MODIFICAR TUDO na aplicação:
1. ALUNOS: Cadastrar novo aluno, editar dados (telefone, valor de mensalidade, vencimento, dores crônicas, etc.), ativar, inativar e excluir alunos.
2. AULAS & GRADE: Criar novos horários na grade semanal, alterar horários/vagas/modalidades, ativar/desativar horários e excluir aulas da grade.
3. AGENDA & FREQUÊNCIA: Agendar alunos, cancelar presenças, suspender aulas em datas específicas (feriados, recesso), reativar aulas suspensas e transferir alunos entre horários.
4. COBRANÇAS & FINANCEIRO: Consultar cobranças e inadimplentes, dar baixa em pagamentos (PIX, dinheiro, cartão), estornar baixas erradas, criar cobranças avulsas (matrícula, avaliação), atualizar valores/vencimentos e cancelar cobranças.
5. CONFIGURAÇÕES: Consultar e alterar chave PIX, nome do estúdio e modelos de mensagem de WhatsApp.
6. VISÃO GERAL: Fornecer panorama executivo completo 360° do estúdio em tempo real.

DIRETRIZES DE EXECUÇÃO:
1. NUNCA peça para o usuário ir fazer a alteração manualmente na tela se você puder executar a ação com suas ferramentas. EXECUTE A AÇÃO DIRETAMENTE.
2. Quando o Brenno pedir para cadastrar, agendar, alterar, desmarcar, dar baixa ou criar, invoque a ferramenta correspondente imediatamente.
3. Seja sempre direto, seguro, proativo e profissional. Responda em português brasileiro.
4. Ao concluir ações, apresente confirmações claras e limpas do que foi alterado.
5. Formate valores monetários em Real (ex: R$ 250,00) e datas em DD/MM/AAAA.
6. Se precisar de dados complementares não informados (ex: dia da semana de uma aula nova), use parâmetros inteligentes ou faça uma pergunta pontual objetiva.`;

  const historicoFormatado = (dados.historico || []).slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages: Anthropic.MessageParam[] = [
    ...historicoFormatado,
    { role: "user" as const, content: dados.mensagem },
  ];

  const acoesAcumuladas: AcaoExecutada[] = [];
  const modeloEfetivo = obterModeloClaude();

  try {
    async function chamarClaude(msgs: Anthropic.MessageParam[]): Promise<Anthropic.Message> {
      return anthropic.messages.create({
        model: modeloEfetivo,
        max_tokens: 4096,
        system: systemPrompt,
        tools: FERRAMENTAS_COPILOTO,
        messages: msgs,
      });
    }

    let respostaAtual = await chamarClaude(messages);

    let iteracoes = 0;
    const MAX_ITERACOES = 6;

    // Loop de Tool Calling multi-step
    while (
      respostaAtual.stop_reason === "tool_use" &&
      iteracoes < MAX_ITERACOES
    ) {
      iteracoes++;
      const toolUseBlocks = respostaAtual.content.filter(
        (b) => b.type === "tool_use"
      );

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

      // Chama o Claude novamente para formular a resposta final ou nova tool
      respostaAtual = await chamarClaude(messages);
    }

    // Extrai o texto final gerado pelo Claude
    const textBlocks = respostaAtual.content.filter((b) => b.type === "text");
    const textoFinal = textBlocks
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

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
