const cdp = require('./cdp.js');
const { definirAcertosExato } = require('./definir-acertos-exato.js');

async function main() {
  const c = await cdp.connect();
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});
  const mapa = { 'STEFHANY LORRANY DOS SANTOS': 14 };
  const resultados = await definirAcertosExato(c, mapa, 14, (m) => console.log(' ', m));
  console.log(JSON.stringify(resultados));
  await cdp.realClick(c, '#cphFuncionalidade_btnAlterar');
  await cdp.waitMs(2500);
  console.log('SALVO');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
