const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';
const mat = '16109257216';

async function main() {
  for (let i = 0; i < 5; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['1'], '1B', nav.DISCIPLINA.Sociologia);
      await cdp.waitMs(4500);
      break;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(2000);
      if (i === 4) throw e;
    }
  }
  const c = await cdp.connect(AUTOMATION_TAB);
  const r = await preencherRecuperacao(c, mat, '7,0');
  console.log(`MariaLuiza Sociologia (correcao): recuperacao 7,0 -> ${JSON.stringify(r)}`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
