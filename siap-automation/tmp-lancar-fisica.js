const cdp = require('./cdp.js');
const { definirAcertosExato } = require('./definir-acertos-exato.js');
const { FISICA } = require('./dados-bloco-cnt-2b.js');

async function main() {
  const c = await cdp.connect();
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});
  console.log('url:', await cdp.evaluate(c, 'location.href'));
  const resultados = await definirAcertosExato(c, FISICA, 13, (m) => console.log(' ', m));
  console.log('pulados:', resultados.filter(r => r.status === 'sem-dado-pulado').map(r => r.nome));
  await cdp.realClick(c, '#cphFuncionalidade_btnAlterar');
  await cdp.waitMs(2500);
  console.log('SALVO. url apos salvar:', await cdp.evaluate(c, 'location.href'));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
