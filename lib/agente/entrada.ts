export type EntradaCopiloto = {
  mensagem: string;
  historico: { role: "user" | "assistant"; content: string }[];
};

export function validarEntradaCopiloto(body: unknown): EntradaCopiloto | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const { mensagem, historico = [] } = body as Record<string, unknown>;
  if (typeof mensagem !== "string" || !mensagem.trim() || mensagem.length > 4000) {
    return null;
  }

  if (!Array.isArray(historico) || historico.length > 6) return null;
  if (!historico.every(
    (item) => item && typeof item === "object" && !Array.isArray(item) &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" && item.content.length <= 4000
  )) return null;

  return {
    mensagem: mensagem.trim(),
    historico: historico.map((item) => ({ role: item.role, content: item.content })),
  };
}
