const fs = require('fs');
const { processarTurma } = require('./corrigir-arredondamento-turma.js');

async function main() {
  const dados = JSON.parse(fs.readFileSync('/tmp/candidatos_arredondamento.json'));
  const relatorio = {};
  for (const [label, candidatos] of Object.entries(dados)) {
    if (label.startsWith('9')) { console.log('PULANDO (9 ano, so reportar):', label); continue; }
    if (!Array.isArray(candidatos) || !candidatos.length) continue;
    const [serieLetra, disc] = label.split('-');
    const serie = serieLetra[0];
    const letra = serieLetra.slice(1);
    console.log('=== ' + label + ' ===');
    try {
      const r = await processarTurma(serie, letra, disc, candidatos, (m) => console.log('  ' + m));
      relatorio[label] = r;
    } catch (e) {
      console.log('  ERRO:', e.message);
      relatorio[label] = { erro: e.message };
    }
  }
  fs.writeFileSync('/tmp/relatorio_arredondamentos.json', JSON.stringify(relatorio, null, 1));
  console.log('SALVO');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
