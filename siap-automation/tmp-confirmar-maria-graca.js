const cdp = require('./cdp.js');
const nav = require('./nav.js');
async function main() {
  const c = await cdp.connect();
  await nav.navigateToNotas(c, nav.SERIE['2'], '2B', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c2 = await cdp.connect();
  console.log('url:', await cdp.evaluate(c2, 'location.href'));
  const mat = '25128336445';
  for (const titulo of ['Média Parcial', 'Recuperação', 'Média Bimestral']) {
    const v = await cdp.evaluate(c2, `(function(){
      var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()===${JSON.stringify(titulo)};});
      if(!lst) return 'SEM-LISTA';
      var item = lst.querySelector('.item[data-matricula="${mat}"]');
      return item ? item.textContent.trim() : 'NAO-ACHOU';
    })()`);
    console.log(titulo + ':', v);
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
