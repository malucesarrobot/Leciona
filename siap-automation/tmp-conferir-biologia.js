const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const linhas = await cdp.evaluate(c, `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    return JSON.stringify(rows.map(function(tr){
      const texto = tr.innerText.trim().split('\\t');
      const nome = texto[0].replace(/^\\d+\\s*-\\s*/, '').trim();
      return { nome, ultimos: texto.slice(-2) };
    }));
  })()`);
  JSON.parse(linhas).forEach(l => console.log(l.nome, '|', l.ultimos.join(' ')));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
