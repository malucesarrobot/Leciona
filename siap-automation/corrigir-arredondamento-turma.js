const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function processarTurma(serieNum, turmaLetra, discNome, candidatos, log) {
  log = log || console.log;
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE[serieNum], serieNum + turmaLetra, nav.DISCIPLINA[discNome]);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const url = await cdp.evaluate(c, 'location.href');
  if (!url.includes('NotasModeloEdicao')) throw new Error('nao chegou: ' + url);

  const indice = await acharIndiceAvaliacao(c);
  const resultados = [];
  for (const cand of candidatos) {
    const mbAtual = parseVirgula(cand.mb);
    const alvo = mbAtual >= 9.7 ? 10 : 6;
    const recAtual = cand.rec ? parseVirgula(cand.rec) : 0;

    const atual = await cdp.evaluate(c, `(function(){
      var el = document.querySelector('.item.subjetiva.nota[data-matricula="${cand.mat}"] input');
      return el ? el.value : null;
    })()`);
    const notaInicial = Math.min(10, parseVirgula(atual || '5') + (alvo - mbAtual) * 1.2);
    const r = await arredondarPara(c, indice, cand.mat, alvo, recAtual, notaInicial, () => {});
    let via = 'atividades';
    let final = r.parcialFinal;
    if (Math.abs(final - alvo) > 0.05 && recAtual === 0) {
      // atividades capada, tenta via recuperacao (mesma nota + decimos)
      const recNecessaria = Math.min(10, 2 * alvo - r.parcialFinal);
      const recStr = recNecessaria.toFixed(1).replace('.', ',');
      await preencherRecuperacao(c, cand.mat, recStr);
      via = 'recuperacao';
      const mbNovo = await cdp.evaluate(c, `(function(){
        var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
        var item = lst.querySelector('.item[data-matricula="${cand.mat}"]');
        return item ? item.textContent.trim() : 'NAO-ACHOU';
      })()`);
      final = parseVirgula(mbNovo);
    }
    log(`${cand.nome} | alvo=${alvo} | via=${via} | final=${final}`);
    resultados.push({ nome: cand.nome, mat: cand.mat, alvo, via, final });
  }
  return resultados;
}

module.exports = { processarTurma };
