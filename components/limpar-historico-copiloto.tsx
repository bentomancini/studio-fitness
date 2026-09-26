"use client";

import { useEffect } from "react";

export function LimparHistoricoCopiloto() {
  useEffect(() => {
    // Remove dados de alunos e finanças persistidos por versões anteriores.
    try {
      localStorage.removeItem("studio_copiloto_historico_v2");
    } catch {
      // Armazenamento pode estar desativado no navegador.
    }
  }, []);

  return null;
}
