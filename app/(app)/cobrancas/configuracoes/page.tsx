import { obterConfiguracoesCobranca } from "@/lib/services/cobrancas";
import { ConfiguracoesCobrancaClient } from "./configuracoes-cobranca-client";

export const metadata = {
  title: "Configurações de Cobrança | Studio Brenno Mancini",
  description: "Personalize sua chave Pix e modelos de mensagem do WhatsApp",
};

export const revalidate = 0;

export default async function ConfiguracoesCobrancaPage() {
  const config = await obterConfiguracoesCobranca();

  return <ConfiguracoesCobrancaClient configInicial={config} />;
}
