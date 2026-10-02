const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
const { parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function navegarComRetry(discValue) {
  for (let i = 0; i < 5; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['1'], '1B', discValue);
      await cdp.waitMs(4500);
      return;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(2000);
      if (i === 4) throw e;
    }
  }
}

async function lerMP(c, mat) {
  return cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
}

async function processarDisciplina(discNome, discValue, alunos) {
  await navegarComRetry(discValue);
  let c = await cdp.connect(AUTOMATION_TAB);
  for (const al of alunos) {
    try {
      let mp = await lerMP(c, al.mat);
      let t = 0;
      while (!mp && t < 4) { await cdp.waitMs(1000); c = await cdp.connect(AUTOMATION_TAB); mp = await lerMP(c, al.mat); t++; }
      if (!mp) { console.log(`${discNome} ${al.nome}: ERRO -> MP nao encontrada`); continue; }
      const mpNum = parseVirgula(mp);
      const rec = Math.max(0, Math.min(10, Math.round((12 - mpNum) * 10) / 10));
      const valorTexto = rec.toFixed(1).replace('.', ',');
      const r = await preencherRecuperacao(c, al.mat, valorTexto);
      console.log(`${discNome} ${al.nome}: MP=${mp} -> recuperacao ${valorTexto} -> ${JSON.stringify(r)}`);
      await cdp.waitMs(400);
    } catch (e) {
      console.log(`${discNome} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  await processarDisciplina('Historia', nav.DISCIPLINA.Historia, [
    { nome: 'Fernanda', mat: '26129956589' },
    { nome: 'Thawanny', mat: '26130252517' },
  ]);
  await processarDisciplina('Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'Fernanda', mat: '26129956589' },
    { nome: 'Thawanny', mat: '26130252517' },
  ]);
  console.log('FIM');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
