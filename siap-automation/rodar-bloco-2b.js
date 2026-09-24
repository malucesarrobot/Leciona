const cdp = require('./cdp.js');
const bloco = require('./lancar-bloco-rede.js');
const fs = require('fs');

const DISC = { filosofia: '15', historia: '4', sociologia: '16', geografia: '3' };
const CHAVE = { filosofia: 'f', historia: 'h', sociologia: 's', geografia: 'g' };

async function main() {
  const discNome = process.argv[2]; // filosofia | historia | sociologia
  const modo = process.argv[3] || 'conferir'; // conferir | salvar
  const mapaRaw = JSON.parse(fs.readFileSync('/private/tmp/claude-502/-Users-MaluRibeiro1/05a7fcd7-9829-4c11-bb39-e5a9ad1d8832/scratchpad/bloco-2b-acertos.json', 'utf8'));
  const chave = CHAVE[discNome];
  const mapa = {};
  for (const [nome, v] of Object.entries(mapaRaw)) mapa[nome] = v[chave];

  const c = await cdp.connect();
  await bloco.abrirBloco(c, {
    composicao: '571', serieValue: '5712', turno: '1', turmaValue: '202618',
    disciplinaValue: DISC[discNome], bimestre: '3', tituloContem: 'BLOCO DA REDE',
  });
  console.log('editor aberto, disciplina', discNome);

  const resultados = await bloco.lancarAcertosGrade(c, mapa, (m) => console.log('  ' + m));
  console.log('resultado marcacao:', JSON.stringify(resultados, null, 1));

  await cdp.waitMs(500);
  const conferencia = await bloco.conferirQtdeAcertos(c);
  console.log('--- CONFERENCIA Qtde.Acertos na tela ---');
  let divergencias = 0;
  for (const linha of conferencia) {
    const esperado = mapa[linha.nome.toUpperCase()];
    if (esperado === undefined) continue;
    const bateu = String(linha.qtdeTexto).trim() === String(esperado);
    if (!bateu) divergencias++;
    console.log((bateu ? 'OK  ' : 'DIFF') + ' ' + linha.nome + ' esperado=' + esperado + ' tela=' + linha.qtdeTexto);
  }
  console.log('divergencias:', divergencias);

  if (modo === 'salvar' && divergencias === 0) {
    console.log('salvando...');
    await bloco.salvar(c);
    console.log('SALVO.');
  } else if (modo === 'salvar') {
    console.log('NAO SALVOU: havia divergencias, corrija antes.');
  } else {
    console.log('modo conferir: nao salvou (rode de novo com "salvar" pra persistir)');
  }

  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
