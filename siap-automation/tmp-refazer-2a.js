const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function main() {
  const c0 = await cdp.connect();
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  console.log('url:', await cdp.evaluate(c, 'location.href'));
  for (const [nome, mat] of [['SAMUEL', '25128277856'], ['YURI', '25128528785']]) {
    const r = await preencherRecuperacao(c, mat, '9,0');
    console.log(nome, JSON.stringify(r));
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
