const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function main() {
  const c0 = await cdp.connect();
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2B', nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const r1 = await preencherRecuperacao(c, '25129114198', '10,0');
  console.log('Sabrina:', JSON.stringify(r1));
  const mb1 = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var item = lst.querySelector('.item[data-matricula="25129114198"]');
    return item ? item.textContent.trim() : 'NAO-ACHOU';
  })()`);
  console.log('Sabrina MB:', mb1);

  const c1b = await cdp.connect();
  await nav.navigateToNotas(c1b, nav.SERIE['3'], '3C', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3000);
  const c2 = await cdp.connect();
  const r2 = await preencherRecuperacao(c2, '24126210528', '10,0');
  console.log('Kaua:', JSON.stringify(r2));
  const mb2 = await cdp.evaluate(c2, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var item = lst.querySelector('.item[data-matricula="24126210528"]');
    return item ? item.textContent.trim() : 'NAO-ACHOU';
  })()`);
  console.log('Kaua MB:', mb2);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
