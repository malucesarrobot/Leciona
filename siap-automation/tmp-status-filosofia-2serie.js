const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function lerTurma(letra) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2' + letra, nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const dados = await cdp.evaluate(c, `(function(){
    var lstMP = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var recs = {};
    Array.from(document.querySelectorAll('.item.recuperacao.nota')).forEach(function(r){ recs[r.getAttribute('data-matricula')] = r.getAttribute('data-nota'); });
    var out = {};
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      var mp = lstMP.querySelector('.item[data-matricula="'+mat+'"]');
      out[mat] = { mp: mp?mp.textContent.trim():null, mb: it.textContent.trim(), rec: recs[mat]||'' };
    });
    return JSON.stringify(out);
  })()`);
  return JSON.parse(dados);
}

async function main() {
  const mats = {
    '25128397825': 'Beatriz', '25128092056': 'Carlos', '21120550256': 'Luana',
    '21119625347': 'MariaClara', '21119081136': 'Leticia', '25128512989': 'Raiane',
    '25128944032': 'Daniely', '25128528785': 'Yuri', '25128108473': 'Reinan',
    '25128104064': 'Mariana', '25128290876': 'Isabella', '25128456312': 'Walisson',
    '25128198782': 'Yago', '25128472013': 'Julia',
  };
  const a = await lerTurma('A');
  const b = await lerTurma('B');
  const todos = Object.assign({}, a, b);
  Object.entries(mats).forEach(([mat, nome]) => {
    const d = todos[mat];
    console.log(nome, '|', mat, '|', d ? JSON.stringify(d) : 'NAO ACHOU NA TURMA');
  });
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
