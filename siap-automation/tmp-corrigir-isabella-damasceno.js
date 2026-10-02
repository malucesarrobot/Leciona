const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula, setNotaAtividade } = require('./arredondar-media.js');

async function main() {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2A', nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(4000);
  const c = await cdp.connect();
  const indice = await acharIndiceAvaliacao(c);
  console.log('indice:', indice);
  const mat = '25128421012';
  const atual = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input');
    return el ? el.value : null;
  })()`);
  console.log('Atividade atual:', atual);
  const mp = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('.item[data-matricula="${mat}"]');
    var listaMP = document.querySelector('.lista.listaDeTotais[title="Média Parcial"] .item[data-matricula="${mat}"]');
    return listaMP ? listaMP.innerText : null;
  })()`);
  console.log('MP atual (raw):', mp);
  const mb = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('.lista.listaDeTotais[title="Média Bimestral"] .item[data-matricula="${mat}"]');
    return el ? el.innerText : null;
  })()`);
  console.log('MB atual (raw):', mb);

  console.log('--- tentando alvo 8.3 com log detalhado ---');
  const r = await arredondarPara(c, indice, mat, 8.3, 0, Math.min(10, parseVirgula(atual || '5') + 2), (msg) => console.log(msg));
  console.log('Resultado final:', JSON.stringify(r));
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
