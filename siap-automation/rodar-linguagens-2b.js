const cdp = require('./cdp.js');
const bloco = require('./lancar-bloco-rede.js');
const exato = require('./lancar-bloco-exato.js');
const fs = require('fs');

const DISC = { educacaofisica: '7', linguainglesa: '322', linguaportuguesa: '1', arte: '8' };
const NQ = { educacaofisica: 7, linguainglesa: 6, linguaportuguesa: 20, arte: 7 };

async function main() {
  const discNome = process.argv[2];
  const modo = process.argv[3] || 'conferir';
  const dados = JSON.parse(fs.readFileSync('/private/tmp/claude-502/-Users-MaluRibeiro1/05a7fcd7-9829-4c11-bb39-e5a9ad1d8832/scratchpad/linguagens-2b-final-v2.json', 'utf8'));
  const mapa = {};
  for (const [nome, discs] of Object.entries(dados)) mapa[nome.toUpperCase()] = discs[discNome];
  const nq = NQ[discNome];

  const c = await cdp.connect();
  await bloco.abrirBloco(c, {
    composicao: '571', serieValue: '5712', turno: '1', turmaValue: '202618',
    disciplinaValue: DISC[discNome], bimestre: '3', tituloContem: 'BLOCO DA REDE',
  });
  console.log('editor aberto, disciplina', discNome, '(' + nq + ' questoes)');

  const resultados = await exato.lancarExato(c, mapa, nq, (m) => console.log('  ' + m));
  console.log('marcados:', resultados.filter(r => r.status === 'marcado').length, '| pulados:', resultados.filter(r => r.status === 'sem-dado-pulado').length);

  await cdp.waitMs(500);
  const conferencia = await bloco.conferirQtdeAcertos(c);
  let divergencias = 0;
  for (const linha of conferencia) {
    const nomeLimpo = linha.nome.trim().toUpperCase();
    const esperadoArr = mapa[nomeLimpo];
    if (esperadoArr === undefined) continue;
    const esperado = esperadoArr.length;
    if (String(linha.qtdeTexto).trim() !== String(esperado)) {
      divergencias++;
      console.log('DIFF', linha.nome, 'esperado=' + esperado, 'tela=' + linha.qtdeTexto);
    }
  }
  console.log('divergencias:', divergencias);

  if (modo === 'salvar' && divergencias === 0) {
    await bloco.salvar(c);
    console.log('SALVO.');
  } else if (modo === 'salvar') {
    console.log('NAO SALVOU: havia divergencias.');
  } else {
    console.log('modo conferir: nao salvou');
  }
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
