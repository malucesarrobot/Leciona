const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function lerTurma(letra) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['1'], '1' + letra, nav.DISCIPLINA.Filosofia);
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
  const todos = Object.assign({}, a, b);
  const mats = {
    '26130448166':'Gabrielle', '26130873558':'JoaoGabriel', '26129977374':'Isabella',
    '26129971560':'Lailla', '26130252517':'Thawanny', '26131703098':'Leticia',
    '26130164180':'MariaSophia', '26130430648':'AnaBeatriz', '26131715155':'Lucas',
    '26131647000':'AnaClara', '24127184321':'Sabrina', '26129979096':'VictorLucas',
  };
  Object.entries(mats).forEach(([mat,nome]) => {
    console.log(nome, '|', mat, '|', todos[mat]?JSON.stringify(todos[mat]):'NAO ACHOU');
  });
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
