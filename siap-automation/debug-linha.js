const cdp = require('./cdp.js');
async function main() {
  const idx = parseInt(process.argv[2], 10);
  const nq = parseInt(process.argv[3] || '6', 10);
  const c = await cdp.connect();
  const js = `(function(){
    const pres = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl00_${idx}');
    const out = { presenca: pres ? { checked: pres.checked, disabled: pres.disabled } : null, questoes: [] };
    for (let q=1;q<=${nq};q++){
      const nn = String(3+q).padStart(2,'0');
      const el = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl'+nn+'_${idx}');
      out.questoes.push(el ? { q, checked: el.checked, disabled: el.disabled } : null);
    }
    return JSON.stringify(out);
  })()`;
  console.log(await cdp.evaluate(c, js));
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
