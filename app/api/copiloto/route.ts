import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processarMensagemCopiloto } from "@/lib/agente/executor";
import { temChaveClaude } from "@/lib/agente/anthropic";

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

    // 2. Lê os dados da requisição
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, resposta: "JSON inválido.", acoes: [] },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, resposta: "Dados da mensagem inválidos.", acoes: [] },
        { status: 400 }
      );
    }

    const { mensagem, historico } = body as { mensagem?: unknown; historico?: unknown };

    if (!mensagem || typeof mensagem !== "string" || !mensagem.trim()) {
      return NextResponse.json(
        { ok: false, resposta: "Mensagem vazia.", acoes: [] },
        { status: 400 }
      );
    }

    // 3. Processa através do Claude
    const resultado = await processarMensagemCopiloto({
      mensagem: mensagem.trim(),
      historico: Array.isArray(historico) ? historico : [],
    });

    return NextResponse.json(resultado);
  } catch (err: unknown) {
    console.error("Erro interno no processamento do Copiloto:", err);
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
  return NextResponse.json({
    status: "online",
    temChave: temChaveClaude(),
  });
}
