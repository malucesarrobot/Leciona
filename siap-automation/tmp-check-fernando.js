const cdp = require('./cdp.js');
const nav = require('./nav.js');
async function main() {
  const c = await cdp.connect();
  await nav.navigateToNotas(c, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3000);
  const c2 = await cdp.connect();
  console.log('url:', await cdp.evaluate(c2, 'location.href'));
  const mat = '26129970400';
  const rec = await cdp.evaluate(c2, `(function(){
    var el = document.querySelector('.item.recuperacao.nota[data-matricula="${mat}"]');
    return el ? el.getAttribute('data-nota') : 'NAO-ACHOU';
  })()`);
  console.log('recuperacao persistida Fernando:', rec);
  const mb = await cdp.evaluate(c2, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){
      var t = l.querySelector('.cabecalho .titulo');
      return t && t.textContent.trim() === 'Média Bimestral';
    });
    var item = lst.querySelector('.item[data-matricula="${mat}"]');
    return item ? item.textContent.trim() : 'NAO-ACHOU';
  })()`);
  console.log('MB Fernando:', mb);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
