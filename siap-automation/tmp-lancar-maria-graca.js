const cdp = require('./cdp.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
async function main() {
  const c = await cdp.connect();
  const r = await preencherRecuperacao(c, '25128336445', '10,0');
  console.log('Maria da Graça:', JSON.stringify(r));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
