const cdp = require('./cdp.js');
async function main() {
  const idx = parseInt(process.argv[2], 10);
  const c = await cdp.connect();
  const js = `(function(){
    const checks = [];
    for (let q=1;q<=5;q++){
      const nn = String(3+q).padStart(2,'0');
      const el = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl'+nn+'_${idx}');
      checks.push({q, checked: el ? el.checked : null});
    }
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    const tr = rows[${idx}];
    const tds = Array.from(tr.querySelectorAll('td'));
    return JSON.stringify({checks, qtde: tds[tds.length-2] ? tds[tds.length-2].innerText.trim() : null});
  })()`;
  console.log(await cdp.evaluate(c, js));
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
