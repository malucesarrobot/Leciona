const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const n = await cdp.evaluate(c, `(function(){
    var checks = document.querySelectorAll('[id^="cphFuncionalidade_cphCampos_gdvLista_ctl"][id$="_0"]');
    return JSON.stringify(Array.from(checks).map(function(e){return e.id;}));
  })()`);
  console.log(n);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
