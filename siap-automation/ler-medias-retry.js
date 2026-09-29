const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

const TURMAS = [
  { label: '1ªB Sociologia', serie: '1', letra: 'B', disc: 'Sociologia' },
  { label: '2ªA Historia', serie: '2', letra: 'A', disc: 'Historia' },
  { label: '2ªB Filosofia', serie: '2', letra: 'B', disc: 'Filosofia' },
];

async function main() {
  const resultado = JSON.parse(fs.readFileSync('/tmp/medias_1e2_siap.json', 'utf8'));
  for (const t of TURMAS) {
    const c = await cdp.connect();
    console.log('lendo', t.label);
    await nav.navigateToNotas(c, nav.SERIE[t.serie], t.serie + t.letra, nav.DISCIPLINA[t.disc]);
    await cdp.waitMs(4000);
    let notas = [];
    for (let i = 0; i < 8; i++) {
      notas = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.item.subjetiva.nota[data-matricula]')).map(e => ({matricula: e.getAttribute('data-matricula'), valor: (e.querySelector('input')?.value||'').trim()})))`));
      if (notas.length > 0) break;
      await cdp.waitMs(1000);
    }
    resultado[t.label] = notas;
    console.log('  ', notas.length, 'alunos lidos');
    await cdp.close(c);
  }
  fs.writeFileSync('/tmp/medias_1e2_siap.json', JSON.stringify(resultado, null, 1));
  console.log('SALVO');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
