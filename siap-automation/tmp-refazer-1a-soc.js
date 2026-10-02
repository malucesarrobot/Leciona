const fs = require('fs');
const { processarTurma } = require('./corrigir-arredondamento-turma.js');

async function main() {
  const dados = JSON.parse(fs.readFileSync('/tmp/candidatos_arredondamento.json'));
  const candidatos = dados['1A-Sociologia'];
  const r = await processarTurma('1', 'A', 'Sociologia', candidatos, (m) => console.log(' ', m));
  console.log(JSON.stringify(r));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
