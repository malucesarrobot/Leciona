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
  { label: '2ªB Historia', serie: '2', letra: 'B', disc: 'Historia' },
  { label: '2ªB Sociologia', serie: '2', letra: 'B', disc: 'Sociologia' },
];

async function lerUma(t, tentativas) {
  tentativas = tentativas || 3;
  for (let tent = 0; tent < tentativas; tent++) {
    const c = await cdp.connect();
    try {
      await nav.navigateToNotas(c, nav.SERIE[t.serie], t.serie + t.letra, nav.DISCIPLINA[t.disc]);
      await cdp.waitMs(3500);
      let notas = [];
      for (let i = 0; i < 8; i++) {
        notas = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.item.subjetiva.nota[data-matricula]')).map(e => ({matricula: e.getAttribute('data-matricula'), valor: (e.querySelector('input')?.value||'').trim()})))`));
        if (notas.length > 0) break;
        await cdp.waitMs(1000);
      }
      await cdp.close(c);
      if (notas.length > 0) return notas;
    } catch (e) {
      console.log('  tentativa falhou:', e.message);
      try { await cdp.close(c); } catch (_) {}
    }
  }
  return [];
}

async function main() {
  const resultado = {};
  for (const t of TURMAS) {
    console.log('lendo', t.label);
    const notas = await lerUma(t);
    resultado[t.label] = notas;
    console.log('  ', notas.length, 'alunos lidos');
  }
  fs.writeFileSync('/tmp/medias_fresh.json', JSON.stringify(resultado, null, 1));
  console.log('SALVO em /tmp/medias_fresh.json');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
