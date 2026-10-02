const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const mat = '26129970400';
  const mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){
      var t = l.querySelector('.cabecalho .titulo');
      return t && t.textContent.trim() === 'Média Bimestral';
    });
    var item = lst.querySelector('.item[data-matricula="${mat}"]');
    return item ? item.textContent.trim() : 'NAO-ACHOU';
  })()`);
  console.log('MB Fernando:', mb);
}
main().catch(e => { console.error(e.message); process.exit(1); });
