const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function navegarComRetry(serieChar, turmaLetra, discValue) {
  for (let i = 0; i < 5; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE[serieChar], turmaLetra, discValue);
      await cdp.waitMs(4500);
      return;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(2000);
      if (i === 4) throw e;
    }
  }
}

async function main() {
  await navegarComRetry('1', '1B', nav.DISCIPLINA.Filosofia);
  let c = await cdp.connect(AUTOMATION_TAB);
  const r1 = await preencherRecuperacao(c, '26130806459', '10,0');
  console.log('Gilmar: recuperacao 10,0 (MP=5,8 -> MB esperado 7,9) ->', JSON.stringify(r1));

  await navegarComRetry('1', '1A', nav.DISCIPLINA.Sociologia);
  c = await cdp.connect(AUTOMATION_TAB);
  const r2 = await preencherRecuperacao(c, '26130076425', '10,0');
  console.log('AnaPaullyna: recuperacao 10,0 (MP=5,0 -> MB esperado 7,5) ->', JSON.stringify(r2));

  console.log('FIM');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
