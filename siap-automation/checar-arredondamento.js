const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function checarTurma(serieNum, turmaLetra, discNome, opts) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE[serieNum], serieNum + turmaLetra, nav.DISCIPLINA[discNome], opts);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const url = await cdp.evaluate(c, 'location.href');
  if (!url.includes('NotasModeloEdicao')) throw new Error('nao chegou: ' + url);

  const dados = await cdp.evaluate(c, `(function(){
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    if (!lstMB) return JSON.stringify({erro:'sem-mb'});
    var alunos = {};
    Array.from(document.querySelectorAll('.listaDeAlunos .item')).forEach(function(e){
      alunos[e.getAttribute('data-matricula')] = (e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,'');
    });
    var recs = {};
    Array.from(document.querySelectorAll('.item.recuperacao.nota')).forEach(function(r){ recs[r.getAttribute('data-matricula')] = r.getAttribute('data-nota'); });
    var out = [];
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      out.push({ mat: mat, nome: alunos[mat]||'???', mb: it.textContent.trim(), rec: recs[mat]||'' });
    });
    return JSON.stringify(out);
  })()`);
  const parsed = JSON.parse(dados);
  if (parsed.erro) throw new Error(parsed.erro);
  const candidatos = parsed.filter(a => {
    const v = parseFloat((a.mb || '').replace(',', '.'));
    return !isNaN(v) && ((v >= 5.7 && v <= 5.9) || (v >= 9.7 && v <= 9.9));
  });
  return { c, todos: parsed, candidatos };
}

module.exports = { checarTurma };
