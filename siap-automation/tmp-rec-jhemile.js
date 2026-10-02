const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function main() {
  const c0 = await cdp.connect();
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2B', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  console.log('url:', await cdp.evaluate(c, 'location.href'));
  const r = await preencherRecuperacao(c, '25129181901', '10,0');
  console.log('Jhemile:', JSON.stringify(r));
  const mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var item = lst.querySelector('.item[data-matricula="25129181901"]');
    return item ? item.textContent.trim() : 'NAO-ACHOU';
  })()`);
  console.log('MB apos rec:', mb);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
