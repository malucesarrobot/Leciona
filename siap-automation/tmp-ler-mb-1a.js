const cdp = require('./cdp.js');
const nav = require('./nav.js');
async function main() {
  const c = await cdp.connect();
  await nav.navigateToNotas(c, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c2 = await cdp.connect();
  console.log('url:', await cdp.evaluate(c2, 'location.href'));
  const dados = await cdp.evaluate(c2, `(function(){
    var lstMP = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var recs = Array.from(document.querySelectorAll('.item.recuperacao.nota'));
    var out = {};
    recs.forEach(function(r){ var mat=r.getAttribute('data-matricula'); out[mat] = {rec: r.getAttribute('data-nota')}; });
    if(lstMP){ Array.from(lstMP.querySelectorAll('.item[data-matricula]')).forEach(function(it){ var mat=it.getAttribute('data-matricula'); if(!out[mat]) out[mat]={}; out[mat].mp = it.textContent.trim(); }); }
    if(lstMB){ Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){ var mat=it.getAttribute('data-matricula'); if(!out[mat]) out[mat]={}; out[mat].mb = it.textContent.trim(); }); }
    return JSON.stringify(out);
  })()`);
  require('fs').writeFileSync('/tmp/mb_1a_historia.json', dados);
  console.log('salvo, tamanho:', dados.length);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
