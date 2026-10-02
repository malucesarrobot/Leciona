const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
async function main() {
  const c = await cdp.connect();
  await nav.navigateToNotas(c, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c2 = await cdp.connect();
  console.log('url:', await cdp.evaluate(c2, 'location.href'));
  const r = await preencherRecuperacao(c2, '26129970400', '9,0');
  console.log('Fernando:', JSON.stringify(r));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
