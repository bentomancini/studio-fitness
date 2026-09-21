import assert from "node:assert";

function calcularPlanoTrimestral(precoMensal) {
  const totalSemDescontoCents = Math.round(precoMensal * 100) * 3;
  const trimestralCents = Math.round(totalSemDescontoCents * 0.95);
  const economiaCents = totalSemDescontoCents - trimestralCents;
  const equivMesCents = Math.round(trimestralCents / 3);

  return {
    totalTrimestral: trimestralCents / 100,
    economia: economiaCents / 100,
    equivalentePorMes: equivMesCents / 100,
    totalSemDesconto: totalSemDescontoCents / 100,
  };
}

console.log("==================================================");
console.log("🧪 TESTANDO CÁLCULOS DOS PLANOS TRIMESTRAIS");
console.log("==================================================");

// Valores de conferência fornecidos pelo usuário:
// 1x = R$ 911,72; 2x = R$ 997,22; 3x = R$ 1.339,22; 4x = R$ 1.681,22; 5x = R$ 1.994,72.

const casos = [
  { freq: "1x", mensal: 319.90, esperadoTrimestral: 911.72, esperadoEquivMes: 303.91, economia: 47.98 },
  { freq: "2x", mensal: 349.90, esperadoTrimestral: 997.22, esperadoEquivMes: 332.41, economia: 52.48 },
  { freq: "3x", mensal: 469.90, esperadoTrimestral: 1339.22, esperadoEquivMes: 446.41, economia: 70.48 },
  { freq: "4x", mensal: 589.90, esperadoTrimestral: 1681.22, esperadoEquivMes: 560.41, economia: 88.48 },
  { freq: "5x", mensal: 699.90, esperadoTrimestral: 1994.72, esperadoEquivMes: 664.91, economia: 104.98 },
];

for (const c of casos) {
  const calc = calcularPlanoTrimestral(c.mensal);
  console.log(`• Plano ${c.freq} (R$ ${c.mensal.toFixed(2)}/mês):`);
  console.log(`  Trimestral calculado: R$ ${calc.totalTrimestral.toFixed(2)} (esperado: R$ ${c.esperadoTrimestral.toFixed(2)})`);
  console.log(`  Economia calculada:   R$ ${calc.economia.toFixed(2)}`);
  console.log(`  Equivalente por mês:  R$ ${calc.equivalentePorMes.toFixed(2)}`);

  assert.strictEqual(calc.totalTrimestral, c.esperadoTrimestral, `Valor trimestral divergente para ${c.freq}`);
  assert.strictEqual(calc.equivalentePorMes, c.esperadoEquivMes, `Equivalente mensal divergente para ${c.freq}`);
  assert.strictEqual(calc.economia, c.economia, `Economia divergente para ${c.freq}`);
  console.log("  ✅ 100% de precisão ao centavo!\n");
}

console.log("🎉 TODOS OS VALORES DE CONFERÊNCIA BATEM PERFEITAMENTE!");
