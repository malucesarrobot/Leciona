const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';
const mat = '21118955991';

async function main() {
  for (let i = 0; i < 4; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['2'], '2A', nav.DISCIPLINA.Sociologia);
      await cdp.waitMs(4000);
      break;
    } catch (e) {
      console.log(`(retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
      if (i === 3) throw e;
    }
  }
  const c = await cdp.connect(AUTOMATION_TAB);
  const indice = await acharIndiceAvaliacao(c);
  const mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
  console.log('MB atual:', mb);
  const mbNum = parseVirgula(mb);
  const alvo = Math.min(10, Math.round((mbNum + 1) * 10) / 10);
  const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input')?.value`);
  const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
  const r = await arredondarPara(c, indice, mat, alvo, 0, notaInicial, () => {});
  console.log(`FernandaPereiraMoura: MBantes=${mb} alvo=${alvo} -> parcial=${r.parcialFinal}`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
