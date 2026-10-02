const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  console.log('url:', await cdp.evaluate(c, 'location.href'));
  const mat = '26129970400';
  let rec = 'NAO-ACHOU';
  for (let i = 0; i < 10; i++) {
    rec = await cdp.evaluate(c, `(function(){
      var el = document.querySelector('.item.recuperacao.nota[data-matricula="${mat}"]');
      return el ? el.getAttribute('data-nota') : 'NAO-ACHOU';
    })()`);
    if (rec !== 'NAO-ACHOU') break;
    await cdp.waitMs(500);
  }
  console.log('recuperacao Fernando:', rec);
  const mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){
      var t = l.querySelector('.cabecalho .titulo');
      return t && t.textContent.trim() === 'Média Bimestral';
    });
    if (!lst) return 'SEM-LISTA';
    var item = lst.querySelector('.item[data-matricula="${mat}"]');
    return item ? item.textContent.trim() : 'NAO-ACHOU';
  })()`);
  console.log('MB Fernando:', mb);
}
main().catch(e => { console.error(e.message); process.exit(1); });
