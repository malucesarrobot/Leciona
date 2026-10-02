const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const mat = '26131715155';
const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';

async function main() {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['1'], '1B', nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(4000);
  let c = await cdp.connect(AUTOMATION_TAB);
  let mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
  let tentativas = 0;
  while (!mb && tentativas < 5) {
    await cdp.waitMs(1500);
    c = await cdp.connect(AUTOMATION_TAB);
    mb = await cdp.evaluate(c, `(function(){
      var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
      var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
      return it ? it.textContent.trim() : null;
    })()`);
    tentativas++;
  }
  if (!mb) { console.log('FALHA: não achou MB do aluno após retries'); process.exit(1); }
  console.log('MB atual:', mb);
  const mbNum = parseVirgula(mb);
  const alvo = Math.min(10, Math.round((mbNum + 1) * 10) / 10);
  console.log('Alvo (atual+1, capado em 10):', alvo);
  const indice = await acharIndiceAvaliacao(c);
  const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input')?.value`);
  const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
  const r = await arredondarPara(c, indice, mat, alvo, 0, notaInicial, () => {});
  console.log('Resultado: parcial final =', r.parcialFinal);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
