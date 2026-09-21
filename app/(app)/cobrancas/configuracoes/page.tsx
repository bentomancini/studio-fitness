import { obterConfiguracoesCobranca } from "@/lib/services/cobrancas";
import { listarPlanos } from "@/lib/services/planos";
import { ConfiguracoesCobrancaClient } from "./configuracoes-cobranca-client";

export const metadata = {
  title: "Configurações de Cobrança e Planos | Studio Brenno Mancini",
  description: "Personalize sua chave Pix, modelos de WhatsApp e planos do studio",
};

export const revalidate = 0;

export default async function ConfiguracoesCobrancaPage() {
  const [config, planos] = await Promise.all([
    obterConfiguracoesCobranca(),
    listarPlanos(),
  ]);

  return <ConfiguracoesCobrancaClient configInicial={config} planosInicial={planos} />;
}
