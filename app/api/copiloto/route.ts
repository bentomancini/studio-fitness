import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processarMensagemCopiloto } from "@/lib/agente/executor";
import { obterModeloClaude, temChaveClaude } from "@/lib/agente/anthropic";
import { validarEntradaCopiloto } from "@/lib/agente/entrada";

const LIMITE_CORPO_BYTES = 32 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Garante que só o dono autenticado tem acesso
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, resposta: "Sessão não autenticada. Faça login novamente.", acoes: [] },
        { status: 401 }
      );
    }

    // 2. Limita o corpo mesmo se a requisição vier sem Content-Length.
    if (req.headers.get("content-type")?.split(";")[0].toLowerCase() !== "application/json") {
      return NextResponse.json({ ok: false, resposta: "Envie JSON.", acoes: [] }, { status: 415 });
    }
    if (Number(req.headers.get("content-length")) > LIMITE_CORPO_BYTES) {
      return NextResponse.json({ ok: false, resposta: "Mensagem muito grande.", acoes: [] }, { status: 413 });
    }

    let body: unknown;
    try {
      const reader = req.body?.getReader();
      if (!reader) throw new Error("Corpo vazio");
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let texto = "";
      let bytes = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > LIMITE_CORPO_BYTES) {
          await reader.cancel().catch(() => {});
          return NextResponse.json(
            { ok: false, resposta: "Mensagem muito grande.", acoes: [] },
            { status: 413 }
          );
        }
        texto += decoder.decode(value, { stream: true });
      }
      body = JSON.parse(texto + decoder.decode());
    } catch {
      return NextResponse.json(
        { ok: false, resposta: "JSON inválido.", acoes: [] },
        { status: 400 }
      );
    }

    const entrada = validarEntradaCopiloto(body);
    if (!entrada) {
      return NextResponse.json(
        { ok: false, resposta: "Dados da mensagem inválidos ou muito longos.", acoes: [] },
        { status: 400 }
      );
    }

    // 3. Processa através do Claude
    const resultado = await processarMensagemCopiloto(entrada);

    return NextResponse.json(resultado, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    console.error("Erro interno no processamento do Copiloto:", err instanceof Error ? err.name : "desconhecido");
    return NextResponse.json(
      {
        ok: false,
        resposta: "Erro interno no processamento do Copiloto.",
        acoes: [],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { status: "online", temChave: temChaveClaude(), modelo: obterModeloClaude() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
