const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const js = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    return JSON.stringify(rows.map(function(tr, i){
      const nome = tr.innerText.trim().split('\\n')[0].replace(/^\\d+\\s*-\\s*/, '').trim();
      const pres = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl00_' + i);
      return { idx: i, nome: nome, presenca: pres ? pres.checked : null };
    }));
  })()`;
  const linhas = JSON.parse(await cdp.evaluate(c, js));
  console.log('total linhas:', linhas.length);
  const samira = linhas.find(l => /SAMIRA/i.test(l.nome));
  console.log('Samira:', JSON.stringify(samira));
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
