const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function navegarComRetry(serieValue, turmaLetra, discValue) {
  for (let i = 0; i < 4; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, serieValue, turmaLetra, discValue);
      await cdp.waitMs(4000);
      return;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
      if (i === 3) throw e;
    }
  }
}

async function processar(serieValue, turmaLetra, discValue, alunos) {
  await navegarComRetry(serieValue, turmaLetra, discValue);
  let c = await cdp.connect(AUTOMATION_TAB);
  let indice = await acharIndiceAvaliacao(c);
  let t = 0;
  while (!indice && t < 5) { await cdp.waitMs(1200); c = await cdp.connect(AUTOMATION_TAB); indice = await acharIndiceAvaliacao(c); t++; }
  for (const al of alunos) {
    try {
      const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input')?.value`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 0.5);
      const r = await arredondarPara(c, indice, al.mat, 6.0, 0, notaInicial, () => {});
      console.log(`${turmaLetra} ${al.nome}: MBantes=${al.mbAntes} -> parcial=${r.parcialFinal}`);
    } catch (e) {
      console.log(`${turmaLetra} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  await processar(nav.SERIE['1'], '1A', nav.DISCIPLINA.Sociologia, [
    { nome: 'LucasSilvaOliveira', mat: '23127125540', mbAntes: '5,8' },
  ]);
  await processar(nav.SERIE['1'], '1B', nav.DISCIPLINA.Filosofia, [
    { nome: 'GilmarAlmeidaSantos', mat: '26130806459', mbAntes: '5,8' },
  ]);
  await processar(nav.SERIE['2'], '2B', nav.DISCIPLINA.Sociologia, [
    { nome: 'MiguelVinicius', mat: '23124035983', mbAntes: '5,7' },
  ]);
  await processar(nav.SERIE['3'], '3A', nav.DISCIPLINA.Filosofia, [
    { nome: 'GustavoRhuan', mat: '22122326127', mbAntes: '5,9' },
  ]);
  await processar(nav.SERIE['3'], '3A', nav.DISCIPLINA.Sociologia, [
    { nome: 'ClaraTifanny', mat: '24127235229', mbAntes: '5,8' },
    { nome: 'GiovanaViera', mat: '23125084850', mbAntes: '5,9' },
  ]);
  console.log('FIM');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
