/* Le direto da tela de Notas do SIAP (coluna Media, ja recalculada pelo
   servidor) os alunos abaixo de 6,0, pra uma lista de turma-disciplina. */
const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

const turmas = [
  { label: '1ªA História', serie: '1', letra: 'A' },
  { label: '1ªB História', serie: '1', letra: 'B' },
  { label: '2ªA História', serie: '2', letra: 'A' },
  { label: '2ªB História', serie: '2', letra: 'B' },
];

async function main() {
  const c = await cdp.connect();
  const resultado = [];
  for (const t of turmas) {
    console.log('=== ' + t.label + ' ===');
    await nav.navigateToNotas(c, nav.SERIE[t.serie], t.serie + t.letra, nav.DISCIPLINA.Historia);
    await cdp.waitMs(3000);
    const nomesPorMat = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeAlunos .item')).map(e => ({
      nome: (e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,''),
      matricula: e.getAttribute('data-matricula'),
    })))`));
    const notas = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.item.subjetiva.nota[data-matricula]')).map(e => ({
      matricula: e.getAttribute('data-matricula'),
      valor: (e.querySelector('input')?.value||'').trim(),
    })))`));
    const notaPorMat = {}; notas.forEach(n => { notaPorMat[n.matricula] = n.valor; });
    const alunos = nomesPorMat.map(a => ({ nome: a.nome, matricula: a.matricula, mediaTexto: notaPorMat[a.matricula] || '' }));
    console.log('  alunos lidos:', alunos.length, '| amostra:', JSON.stringify(alunos.slice(0,2)));
    resultado.push({ turma: t.label, alunos });
  }
  await cdp.close(c);
  fs.writeFileSync('/tmp/medias-siap.json', JSON.stringify(resultado, null, 1));
  console.log('salvo em /tmp/medias-siap.json');
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
