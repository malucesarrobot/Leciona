const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function lerTurma(letra) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['3'], '3' + letra, nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(3500);
  const c = await cdp.connect();
  const dados = await cdp.evaluate(c, `(function(){
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    if(!lstMB) return JSON.stringify({erro:'sem-mb'});
    var recs = {};
    Array.from(document.querySelectorAll('.item.recuperacao.nota')).forEach(function(r){ recs[r.getAttribute('data-matricula')] = r.getAttribute('data-nota'); });
    var out = {};
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      out[mat] = { mb: it.textContent.trim(), rec: recs[mat]||'' };
    });
    return JSON.stringify(out);
  })()`);
  return JSON.parse(dados);
}

async function main() {
  const a = await lerTurma('A');
  const b = await lerTurma('B');
  const cc = await lerTurma('C');
  const todos = Object.assign({}, a, b, cc);
  const mats = {
    '24127191622':'MariaEduarda', '24127200687':'Daniel', '22122278909':'Erika',
    '23127125743':'Laysa', '23127123544':'JoaoVitor', '25129232285':'Mayckon',
    '24126667727':'Kimberly', '24127146140':'Heloisa', '24126088581':'Davi',
    '24126295214':'Kevin', '20117731298':'Thaina', '23127134100':'Caroline',
    '24126268277':'Debora', '25128182738':'Thiago',
  };
  Object.entries(mats).forEach(([mat,nome]) => {
    console.log(nome, '|', mat, '|', todos[mat]?JSON.stringify(todos[mat]):'NAO ACHOU');
  });
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
