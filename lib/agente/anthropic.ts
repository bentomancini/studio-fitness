import Anthropic from "@anthropic-ai/sdk";

/**
 * Retorna o identificador do modelo Claude higienizado contra quebras de linha,
 * espaços e caracteres invisíveis comuns em variáveis de ambiente da Vercel.
 */
export function obterModeloClaude(): string {
  const raw = process.env.CLAUDE_MODEL || "";
  const limpo = raw.trim().replace(/[\r\n\t"']/g, "");
  return limpo || "claude-haiku-4-5-20251001";
}

export const MODELO_PADRAO = obterModeloClaude();

export function obterClienteClaude(): Anthropic | null {
  const rawKey = process.env.ANTHROPIC_API_KEY || "";
  const apiKey = rawKey.trim().replace(/[\r\n\t"']/g, "");
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return null;
  }
  return new Anthropic({ apiKey });
}

export function temChaveClaude(): boolean {
  const rawKey = process.env.ANTHROPIC_API_KEY || "";
  const apiKey = rawKey.trim().replace(/[\r\n\t"']/g, "");
  return Boolean(apiKey && apiKey.startsWith("sk-ant-"));
}
