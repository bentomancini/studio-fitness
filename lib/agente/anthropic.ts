import Anthropic from "@anthropic-ai/sdk";

// Modelo fixo: uma CLAUDE_MODEL antiga na Vercel não deve reativar o Haiku.
export function obterModeloClaude(): string {
  return "claude-opus-5-5";
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
