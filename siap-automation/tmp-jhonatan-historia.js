const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
const { parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';
const mat = '22121833425';

async function main() {
  for (let i = 0; i < 5; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
      await cdp.waitMs(4500);
      break;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(2000);
      if (i === 4) throw e;
    }
  }
  const c = await cdp.connect(AUTOMATION_TAB);
  const mp = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
  console.log('MP atual:', mp);
  const mpNum = parseVirgula(mp);
  const rec = Math.max(0, Math.min(10, Math.round((12 - mpNum) * 10) / 10));
  const valorTexto = rec.toFixed(1).replace('.', ',');
  const r = await preencherRecuperacao(c, mat, valorTexto);
  console.log(`Jhonatan: MP=${mp} -> recuperacao ${valorTexto} -> ${JSON.stringify(r)}`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
