/* Checagem rápida e silenciosa: SIAP está logado na aba de automação?
   Usado pelo watcher (Monitor) pra saber quando retomar sozinho depois
   de um login manual da Malu. Sai com codigo 0 + "LOGADO" se sim,
   codigo 1 + "DESLOGADO" (ou erro) se não. */
const cdp = require('./cdp.js');

async function main() {
  try {
    const c = await cdp.connect();
    const logado = await cdp.evaluate(c, `document.body && document.body.innerText.includes('Sair')`);
    await cdp.close(c);
    if (logado) { console.log('LOGADO'); process.exit(0); }
    console.log('DESLOGADO'); process.exit(1);
  } catch (e) {
    console.log('SEM-ABA: ' + e.message); process.exit(1);
  }
}
main();
