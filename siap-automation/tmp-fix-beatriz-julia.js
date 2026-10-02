const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function main() {
  const c0 = await cdp.connect();
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2A', nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const r1 = await preencherRecuperacao(c, '25128397825', '9,0');
  console.log('Beatriz:', JSON.stringify(r1));

  const c1b = await cdp.connect();
  await nav.navigateToNotas(c1b, nav.SERIE['2'], '2B', nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(3000);
  const c2 = await cdp.connect();
  const r2 = await preencherRecuperacao(c2, '25128472013', '9,0');
  console.log('Julia:', JSON.stringify(r2));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
