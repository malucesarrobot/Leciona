const cdp = require('./cdp.js');
const nav = require('./nav.js');

const SERIE = { '1': '5711', '2': '5712' };

async function lerTurma(serieNum, turmaLetra, discNome) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  try {
    await nav.navigateToNotas(c0, SERIE[serieNum], serieNum + turmaLetra, nav.DISCIPLINA[discNome]);
  } catch (e) {
    return { erro: e.message };
  }
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const url = await cdp.evaluate(c, 'location.href');
  if (!url.includes('NotasModeloEdicao')) return { erro: 'nao-chegou: ' + url };

  const dados = await cdp.evaluate(c, `(function(){
    var lstMP = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    if (!lstMB) return JSON.stringify({erro:'sem-media-bimestral'});
    var recs = {};
    Array.from(document.querySelectorAll('.item.recuperacao.nota')).forEach(function(r){ recs[r.getAttribute('data-matricula')] = r.getAttribute('data-nota'); });
    var alunos = {};
    Array.from(document.querySelectorAll('.listaDeAlunos .item')).forEach(function(e){
      alunos[e.getAttribute('data-matricula')] = (e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,'');
    });
    var out = [];
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      var mp = lstMP ? lstMP.querySelector('.item[data-matricula="'+mat+'"]') : null;
      out.push({ mat: mat, nome: alunos[mat]||'???', mp: mp?mp.textContent.trim():null, mb: it.textContent.trim(), rec: recs[mat]||'' });
    });
    return JSON.stringify(out);
  })()`);
  return { dados: JSON.parse(dados) };
}

module.exports = { lerTurma };

if (require.main === module) {
  const [serie, letra, disc] = process.argv.slice(2);
  lerTurma(serie, letra, disc).then(r => {
    if (r.erro) { console.log('ERRO:', r.erro); process.exit(1); }
    r.dados.forEach(a => console.log(a.nome, '|', a.mat, '| MP:', a.mp, '| Rec:', a.rec || '-', '| MB:', a.mb));
    require('fs').writeFileSync('/tmp/mb_atual.json', JSON.stringify(r.dados));
  }).catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
}
