import { listarPainelCobrancas, obterConfiguracoesCobranca } from "@/lib/services/cobrancas";
import { listarAlunosAtivos } from "@/lib/services/alunos";
import { CobrancasClient } from "./cobrancas-client";

export const metadata = {
  title: "Cobranças | Studio Brenno Mancini",
  description: "Controle financeiro de mensalidades e cobrança ágil via WhatsApp",
};

export const revalidate = 0; // Dados sempre frescos ao acessar

export default async function CobrancasPage() {
  const [painel, config, alunosAtivos] = await Promise.all([
    listarPainelCobrancas(),
    obterConfiguracoesCobranca(),
    listarAlunosAtivos(),
  ]);

  return (
    <CobrancasClient
      painelInicial={painel}
      config={config}
      alunosAtivos={alunosAtivos}
    />
  );
}
