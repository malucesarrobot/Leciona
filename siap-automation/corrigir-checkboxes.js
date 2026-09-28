/* Ajusta os checkboxes de questao de UM aluno numa tela de Bloco (grade)
   pro estado exato desejado — clica só onde atual != alvo, em vez de só
   marcar as N primeiras (útil quando o estado atual já está contaminado
   com cliques anteriores errados). */
const cdp = require('./cdp.js');
async function main() {
  const idx = parseInt(process.argv[2], 10);
  const alvo = process.argv[3].split(',').map(Number); // ex: 1,2,10 = questoes locais corretas
  const nq = parseInt(process.argv[4] || '15', 10);
  const c = await cdp.connect();

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
  console.log('atual antes:', atual);

  for (let q = 1; q <= nq; q++) {
    const nn = String(3 + q).padStart(2, '0');
    const sel = '#cphFuncionalidade_cphCampos_gdvLista_ctl' + nn + '_' + idx;
    await cdp.setChecked(c, sel, alvoSet.has(q));
    await cdp.waitMs(100);
  }

  const depois = JSON.parse(await cdp.evaluate(c, jsLer));
  console.log('atual depois:', depois);
  const jsQtde = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    const tr = rows[${idx}];
    const tds = Array.from(tr.querySelectorAll('td'));
    return tds[tds.length-2].innerText.trim();
  })()`;
  console.log('Qtde.Acertos:', await cdp.evaluate(c, jsQtde));
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
