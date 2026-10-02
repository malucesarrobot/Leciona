const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';

async function navegarComRetry(fn) {
  for (let i = 0; i < 4; i++) {
    try { await fn(); return; }
    catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
      if (i === 3) throw e;
    }
  }
}

async function processarTurma(turmaLetra, discNome, alunos) {
  await navegarComRetry(async () => {
    const c0 = await cdp.connect(AUTOMATION_TAB);
    await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
    await nav.navigateToNotas(c0, nav.SERIE['3'], turmaLetra, nav.DISCIPLINA[discNome]);
    await cdp.waitMs(4000);
  });
  let c = await cdp.connect(AUTOMATION_TAB);
  let indice = await acharIndiceAvaliacao(c);
  let t = 0;
  while (!indice && t < 5) { await cdp.waitMs(1200); c = await cdp.connect(AUTOMATION_TAB); indice = await acharIndiceAvaliacao(c); t++; }
  for (const al of alunos) {
    try {
      const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input')?.value`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
      const r = await arredondarPara(c, indice, al.mat, 6.0, al.rec, notaInicial, () => {});
      console.log(`${turmaLetra} ${discNome} ${al.nome}: rec=${al.rec} MPantes=${al.mpAntes} -> parcial=${r.parcialFinal} (MB esperado=${Math.max(r.parcialFinal, (r.parcialFinal + al.rec) / 2).toFixed(1)})`);
    } catch (e) {
      console.log(`${turmaLetra} ${discNome} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  await processarTurma('3B', 'Filosofia', [
    { nome: 'Daniel', mat: '23127123533', rec: 7.0, mpAntes: 4.2 },
    { nome: 'Ivan', mat: '24127146195', rec: 6.0, mpAntes: 3.1 },
  ]);
  await processarTurma('3B', 'Historia', [
    { nome: 'CarlosEduardo', mat: '20118603147', rec: 6.0, mpAntes: 3.2 },
    { nome: 'Jhenyfer', mat: '24127171840', rec: 7.0, mpAntes: 3.8 },
  ]);
  await processarTurma('3B', 'Sociologia', [
    { nome: 'CarlosEduardo', mat: '20118603147', rec: 6.0, mpAntes: 4.1 },
    { nome: 'Daniel', mat: '23127123533', rec: 7.5, mpAntes: 4.2 },
    { nome: 'Samuel', mat: '20117319501', rec: 6.0, mpAntes: 5.7 },
  ]);
  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
