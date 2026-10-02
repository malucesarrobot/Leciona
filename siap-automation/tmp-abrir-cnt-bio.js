const cdp = require('./cdp.js');
async function main() {
  let c = await cdp.connect();
  const idx = await cdp.evaluate(c, `(function(){
    const rows = Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr'));
    for (let i=1;i<rows.length;i++){ if(/Bloco da Rede CNT/i.test(rows[i].innerText)) return i; }
    return -1;
  })()`);
  console.log('idx:', idx);
  await cdp.evaluate(c, `document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')[${idx}].click()`);
  await cdp.waitMs(1500);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnEditar');
  await cdp.waitMs(2500);
  c = await cdp.connect();
  console.log('url:', await cdp.evaluate(c, 'location.href'));
  const linhas = await cdp.evaluate(c, `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    return JSON.stringify(rows.slice(0,3).map(r => r.innerText.replace(/\\n/g,' | ').slice(0,300)));
  })()`);
  console.log('primeiras linhas:', linhas);
  const numQ = await cdp.evaluate(c, `(function(){
    var headers = document.querySelectorAll('th, .cabecalho');
    return document.body.innerText.match(/Q\\d+/g);
  })()`);
  console.log('colunas Q encontradas:', numQ ? [...new Set(numQ)].length : 0, numQ ? [...new Set(numQ)].slice(-5) : []);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
