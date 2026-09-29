/* Lanca o Bloco da Rede CNT (Ciencias da Natureza) pra 2B, usando os mapas
   exatos extraidos do PDF Resultados_2B_Consolidado_Oficial_Definitivo. */
const cdp = require('./cdp.js');
const bloco = require('./lancar-bloco-rede.js');
const exato = require('./lancar-bloco-exato.js');
const fs = require('fs');

async function rodar(discValue, nq, mapaFile, label) {
  const mapa = JSON.parse(fs.readFileSync(mapaFile, 'utf8'));
  const mapaUpper = {};
  Object.keys(mapa).forEach(k => { mapaUpper[k.toUpperCase()] = mapa[k]; });

  const c = await cdp.connect();
  console.log(`\n=== ${label} (disc=${discValue}, nq=${nq}) ===`);
  await bloco.abrirBloco(c, {
    composicao: '571',
    serieValue: '5712',
    turno: '1',
    turmaValue: '202618',
    disciplinaValue: discValue,
    bimestre: '3',
    tituloContem: 'Bloco da Rede CNT'
  });
  // a grade de alunos (table tr "1 - NOME...") carrega por AJAX separado do
  // resto da tela de edicao — espera de verdade antes de tentar marcar,
  // senao lerLinhas() volta vazio e o "salvar" final nao salva nada.
  let linhasOk = false;
  for (let i = 0; i < 15; i++) {
    const linhas = await bloco.lerLinhas(c);
    if (linhas.length > 0) { linhasOk = true; break; }
    await cdp.waitMs(1000);
  }
  console.log('  grade de alunos carregou?', linhasOk);
  if (!linhasOk) throw new Error('grade de alunos nao carregou a tempo');
  const resultados = await exato.lancarExato(c, mapaUpper, nq, (m) => console.log('  ' + m));
  await bloco.salvar(c);
  console.log('  SALVO');
  console.log(JSON.stringify(resultados, null, 1));
  await cdp.close(c);
  return resultados;
}

async function main() {
  const qual = process.argv[2]; // 'biologia' ou 'fisquim'
  if (qual === 'biologia') {
    await rodar('10', 14, '/tmp/mapa_biologia.json', 'Biologia 2B');
  } else if (qual === 'fisquim') {
    await rodar('13', 13, '/tmp/mapa_fisquim.json', 'Fisica/Quimica 2B');
  } else {
    console.error('uso: node rodar-cnat-2b.js biologia|fisquim');
    process.exit(1);
  }
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
