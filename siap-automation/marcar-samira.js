const cdp = require('./cdp.js');
async function main() {
  const idx = parseInt(process.argv[2], 10);
  const acertos = parseInt(process.argv[3], 10);
  const c = await cdp.connect();
  for (let q = 1; q <= acertos; q++) {
    const nn = String(3 + q).padStart(2, '0');
    const sel = '#cphFuncionalidade_cphCampos_gdvLista_ctl' + nn + '_' + idx;
    const r = await cdp.click(c, sel);
    console.log('clique Q' + q + ' (' + sel + '):', r);
    await cdp.waitMs(150);
  }
  const js = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    const tr = rows[${idx}];
    const tds = Array.from(tr.querySelectorAll('td'));
    return tds[tds.length-2] ? tds[tds.length-2].innerText.trim() : null;
  })()`;
  const qtde = await cdp.evaluate(c, js);
  console.log('Qtde.Acertos agora:', qtde);
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
