const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function tentar(serieLetra, mat, nome) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['1'], serieLetra, nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(4000);
  const c = await cdp.connect();
  const r = await preencherRecuperacao(c, mat, '9,0');
  console.log(nome + ':', JSON.stringify(r));
  return r;
}

async function main() {
  await tentar('1A', '26130164180', 'MariaSophia');
  await tentar('1B', '26129979096', 'VictorLucas');
  await tentar('1B', '26130252517', 'Thawanny');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
