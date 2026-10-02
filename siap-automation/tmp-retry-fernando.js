const cdp = require('./cdp.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
async function main() {
  const c = await cdp.connect();
  const r = await preencherRecuperacao(c, '26129970400', '9,0');
  console.log('Fernando:', JSON.stringify(r));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
