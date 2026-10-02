const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { checarTurma } = require('./checar-arredondamento.js');

async function main() {
  const combos = [
    ['1', 'A', 'Sociologia'], ['1', 'B', 'Sociologia'], ['2', 'A', 'Sociologia'], ['2', 'B', 'Sociologia'],
    ['3', 'A', 'Sociologia'], ['3', 'B', 'Sociologia'], ['3', 'C', 'Sociologia'],
    ['1', 'A', 'Filosofia'], ['1', 'B', 'Filosofia'], ['2', 'A', 'Filosofia'], ['2', 'B', 'Filosofia'],
    ['3', 'A', 'Filosofia'], ['3', 'B', 'Filosofia'], ['3', 'C', 'Filosofia'],
    ['3', 'A', 'Historia'], ['3', 'B', 'Historia'], ['3', 'C', 'Historia'],
  ];
  const cepiCombos = [['9', 'A', 'Historia'], ['9', 'C', 'Historia']];
  const resultado = {};
  for (const [serie, letra, disc] of combos) {
    const label = serie + letra + '-' + disc;
    try {
      const { candidatos, todos } = await checarTurma(serie, letra, disc);
      console.log(label, '- total:', todos.length, '- candidatos arredondamento:', candidatos.length);
      candidatos.forEach(c => console.log('   ', c.nome, '|', c.mat, '| MB:', c.mb));
      resultado[label] = candidatos;
    } catch (e) {
      console.log(label, 'ERRO:', e.message);
      resultado[label] = { erro: e.message };
    }
  }
  for (const [serie, letra, disc] of cepiCombos) {
    const label = serie + letra + '-' + disc;
    try {
      const { candidatos, todos } = await checarTurma(serie, letra, disc, { composicao: nav.CEPI.composicao, turno: nav.CEPI.turno });
      console.log(label, '- total:', todos.length, '- candidatos arredondamento:', candidatos.length);
      candidatos.forEach(c => console.log('   ', c.nome, '|', c.mat, '| MB:', c.mb));
      resultado[label] = candidatos;
    } catch (e) {
      console.log(label, 'ERRO:', e.message);
      resultado[label] = { erro: e.message };
    }
  }
  require('fs').writeFileSync('/tmp/candidatos_arredondamento.json', JSON.stringify(resultado, null, 1));
  console.log('SALVO');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
