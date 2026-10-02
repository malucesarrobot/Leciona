const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';

async function lerMB(c, mat) {
  return cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
}

async function navegarComRetry(turmaLetra, disc) {
  for (let i = 0; i < 4; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['3'], turmaLetra, disc);
      await cdp.waitMs(4000);
      return;
    } catch (e) {
      console.log(`  (retry navegação ${turmaLetra}, tentativa ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
    }
  }
  throw new Error('navegação falhou após 4 tentativas');
}

async function processarTurma(turmaLetra, disc, alunos) {
  await navegarComRetry(turmaLetra, disc);
  let c = await cdp.connect(AUTOMATION_TAB);
  let indice = await acharIndiceAvaliacao(c);
  let ti = 0;
  while (!indice && ti < 5) { await cdp.waitMs(1200); c = await cdp.connect(AUTOMATION_TAB); indice = await acharIndiceAvaliacao(c); ti++; }
  for (const al of alunos) {
    try {
      if (al.via === 'recuperacao') {
        const r = await preencherRecuperacao(c, al.mat, '9,0');
        console.log(`${turmaLetra} ${al.nome}: recuperacao 9,0 -> ${JSON.stringify(r)}`);
        continue;
      }
      let mb = await lerMB(c, al.mat);
      let t = 0;
      while (!mb && t < 4) { await cdp.waitMs(1200); mb = await lerMB(c, al.mat); t++; }
      if (!mb) { console.log(`${turmaLetra} ${al.nome}: ERRO -> MB não encontrado`); continue; }
      const mbNum = parseVirgula(mb);
      const alvo = Math.min(10, Math.round((mbNum + 1) * 10) / 10);
      const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input')?.value`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
      const r = await arredondarPara(c, indice, al.mat, alvo, 0, notaInicial, () => {});
      console.log(`${turmaLetra} ${al.nome}: MBantes=${mb} alvo=${alvo} -> parcial=${r.parcialFinal}`);
    } catch (e) {
      console.log(`${turmaLetra} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

const GRUPOS = [
  ['3A', nav.DISCIPLINA.Filosofia, [
    { nome: 'Israel', mat: '23127134096' },
    { nome: 'Cecilia', mat: '24127146060' },
    { nome: 'Kevilla', mat: '24127190980' },
    { nome: 'Janaina', mat: '24126180370' },
    { nome: 'Bruno', mat: '24126941341' },
  ]],
  ['3C', nav.DISCIPLINA.Filosofia, [
    { nome: 'JoaoEden', mat: '24127200767' },
    { nome: 'Sophia', mat: '24127408848' },
    { nome: 'DeboraEugenio', mat: '24127207926' },
    { nome: 'Isaac', mat: '24127190969' },
  ]],
  ['3A', nav.DISCIPLINA.Sociologia, [
    { nome: 'Thiago', mat: '25128182738' },
    { nome: 'Israel', mat: '23127134096' },
    { nome: 'GustavoRhuan', mat: '22122326127' },
    { nome: 'Cecilia', mat: '24127146060', via: 'recuperacao' },
    { nome: 'Kevilla', mat: '24127190980' },
    { nome: 'Janaina', mat: '24126180370' },
    { nome: 'Bruno', mat: '24126941341' },
  ]],
  ['3C', nav.DISCIPLINA.Sociologia, [
    { nome: 'JoaoEden', mat: '24127200767' },
    { nome: 'Sophia', mat: '24127408848' },
    { nome: 'DeboraEugenio', mat: '24127207926' },
    { nome: 'Isaac', mat: '24127190969' },
  ]],
];

async function main() {
  for (const [letra, disc, alunos] of GRUPOS) {
    console.log(`=== ${letra} disc=${disc} ===`);
    try {
      await processarTurma(letra, disc, alunos);
    } catch (e) {
      console.log(`GRUPO ${letra} FALHOU POR COMPLETO: ${e.message}`);
    }
  }
  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
