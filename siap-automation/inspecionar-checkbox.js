const cdp = require('./cdp.js');
async function main() {
  const sel = process.argv[2];
  const c = await cdp.connect();
  const js = `(function(){
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return JSON.stringify({erro:'nao encontrado'});
    const span = el.closest('span');
    const td = el.closest('td');
    const r = el.getBoundingClientRect();
    return JSON.stringify({
      rect: {x:r.x, y:r.y, w:r.width, h:r.height},
      spanClass: span ? span.className : null,
      tdHTML: td ? td.outerHTML.slice(0,400) : null,
      elName: el.name,
      elDisabled: el.disabled,
    });
  })()`;
  console.log(await cdp.evaluate(c, js));
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
