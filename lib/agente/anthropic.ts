import Anthropic from "@anthropic-ai/sdk";

export const MODELO_PADRAO = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

export function obterClienteClaude(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return null;
  }
  return new Anthropic({ apiKey });
}

export function temChaveClaude(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return Boolean(apiKey && apiKey.startsWith("sk-ant-"));
}
