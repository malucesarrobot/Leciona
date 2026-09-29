const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

const TURMAS = [
  { label: '1ªA Filosofia', serie: '1', letra: 'A', disc: 'Filosofia' },
  { label: '1ªA Historia', serie: '1', letra: 'A', disc: 'Historia' },
  { label: '1ªA Sociologia', serie: '1', letra: 'A', disc: 'Sociologia' },
  { label: '1ªB Filosofia', serie: '1', letra: 'B', disc: 'Filosofia' },
  { label: '1ªB Historia', serie: '1', letra: 'B', disc: 'Historia' },
  { label: '1ªB Sociologia', serie: '1', letra: 'B', disc: 'Sociologia' },
  { label: '2ªA Filosofia', serie: '2', letra: 'A', disc: 'Filosofia' },
  { label: '2ªA Historia', serie: '2', letra: 'A', disc: 'Historia' },
  { label: '2ªA Sociologia', serie: '2', letra: 'A', disc: 'Sociologia' },
  { label: '2ªB Filosofia', serie: '2', letra: 'B', disc: 'Filosofia' },
];

async function main() {
  const c = await cdp.connect();
  const resultado = {};
  for (const t of TURMAS) {
    console.log('lendo', t.label);
    await nav.navigateToNotas(c, nav.SERIE[t.serie], t.serie + t.letra, nav.DISCIPLINA[t.disc]);
    await cdp.waitMs(3000);
    const notas = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.item.subjetiva.nota[data-matricula]')).map(e => ({matricula: e.getAttribute('data-matricula'), valor: (e.querySelector('input')?.value||'').trim()})))`));
    resultado[t.label] = notas;
    console.log('  ', notas.length, 'alunos lidos');
  }
  await cdp.close(c);
  fs.writeFileSync('/tmp/medias_1e2_siap.json', JSON.stringify(resultado, null, 1));
  console.log('SALVO em /tmp/medias_1e2_siap.json');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
