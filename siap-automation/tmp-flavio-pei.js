const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';
const mat = '20118244532';

async function navegarComRetry(discValue) {
  for (let i = 0; i < 4; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['3'], '3A', discValue);
      await cdp.waitMs(4000);
      return;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
      if (i === 3) throw e;
    }
  }
}

async function corrigir(discNome, discValue) {
  await navegarComRetry(discValue);
  let c = await cdp.connect(AUTOMATION_TAB);
  const mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
  console.log(`${discNome}: MB atual =`, mb);
  const mbNum = parseVirgula(mb);
  if (!isNaN(mbNum) && mbNum >= 6) { console.log(`${discNome}: já está OK, sem ação.`); return; }
  const indice = await acharIndiceAvaliacao(c);
  const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input')?.value`);
  const r = await arredondarPara(c, indice, mat, 6.0, 0, Math.min(10, parseVirgula(atual || '5') + 2), () => {});
  console.log(`${discNome}: subindo Atividades -> parcial=${r.parcialFinal}`);
  if (r.parcialFinal < 6) {
    const rec = Math.max(0, Math.min(10, Math.round((12 - r.parcialFinal) * 10) / 10));
    const rr = await preencherRecuperacao(c, mat, rec.toFixed(1).replace('.', ','));
    console.log(`${discNome}: completado com Recuperacao=${rec} ->`, JSON.stringify(rr));
  }
}

async function main() {
  await corrigir('Filosofia', nav.DISCIPLINA.Filosofia);
  await corrigir('Sociologia', nav.DISCIPLINA.Sociologia);
  await corrigir('Historia', nav.DISCIPLINA.Historia);
  console.log('FIM');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
