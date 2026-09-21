import { NextRequest, NextResponse } from "next/server";
import { exigeDono } from "@/lib/exige-login";
import { processarMensagemCopiloto } from "@/lib/agente/executor";
import { temChaveClaude } from "@/lib/agente/anthropic";

export async function POST(req: NextRequest) {
  try {
    // 1. Garante que só o dono autenticado tem acesso
    await exigeDono();

    // 2. Lê os dados da requisição
    const body = await req.json();
    const { mensagem, historico } = body;

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
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        resposta: "Erro interno no processamento do Copiloto.",
        erro: msg,
        acoes: [],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  await exigeDono();
  return NextResponse.json({
    status: "online",
    temChave: temChaveClaude(),
  });
}
