const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';
const mat = '24126941341';

async function main() {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['3'], '3A', nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(4000);
  const c = await cdp.connect(AUTOMATION_TAB);
  // MP atual (Atividade=10) = 5,8. Precisa Rec=6,2 pra MB=(5,8+6,2)/2=6,0.
  const r = await preencherRecuperacao(c, mat, '6,2');
  console.log('Recuperacao 6,2 ->', JSON.stringify(r));
  await cdp.waitMs(1000);
  const mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
  console.log('MB final confirmado:', mb);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
