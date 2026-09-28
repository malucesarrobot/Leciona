/* Marca presenca + acertos exatos de UM aluno (por idx) na tela de Bloco
   ja aberta, confere e reporta — nao navega, nao salva sozinho. */
const cdp = require('./cdp.js');
async function main() {
  const idx = parseInt(process.argv[2], 10);
  const alvo = process.argv[3].split(',').filter(Boolean).map(Number);
  const nq = parseInt(process.argv[4], 10);
  const c = await cdp.connect();

  const presSel = '#cphFuncionalidade_cphCampos_gdvLista_ctl00_' + idx;
  await cdp.setChecked(c, presSel, true);
  await cdp.waitMs(200);

  const alvoSet = new Set(alvo);
  const jsLer = `(function(){
    const checks = [];
    for (let q=1;q<=${nq};q++){
      const nn = String(3+q).padStart(2,'0');
      const el = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl'+nn+'_${idx}');
      checks.push(el ? (el.checked?1:0) : null);
    }
    return JSON.stringify(checks);
  })()`;
  const atual = JSON.parse(await cdp.evaluate(c, jsLer));
  console.log('checkboxes antes:', atual);

  for (let q = 1; q <= nq; q++) {
    const nn = String(3 + q).padStart(2, '0');
    const sel = '#cphFuncionalidade_cphCampos_gdvLista_ctl' + nn + '_' + idx;
    await cdp.setChecked(c, sel, alvoSet.has(q));
    await cdp.waitMs(100);
  }

  const depois = JSON.parse(await cdp.evaluate(c, jsLer));
  console.log('checkboxes depois:', depois);
  const jsQtde = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    const tr = rows[${idx}];
    const tds = Array.from(tr.querySelectorAll('td'));
    return { nome: tr.innerText.trim().split('\\n')[0], qtde: tds[tds.length-2].innerText.trim() };
  })()`;
  console.log(await cdp.evaluate(c, jsQtde));
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
