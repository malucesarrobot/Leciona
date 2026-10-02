const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';
const mat = '22122339130';

async function main() {
  for (let i = 0; i < 4; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['3'], '3C', nav.DISCIPLINA.Historia);
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
  const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input')?.value`);
  console.log('Atividade atual:', atual);
  const r = await arredondarPara(c, indice, mat, 6.0, 0, 10, () => {});
  console.log('Resultado subindo Atividades: parcial=' + r.parcialFinal);
  if (r.parcialFinal < 6) {
    const rec = Math.max(0, Math.min(10, Math.round((12 - r.parcialFinal) * 10) / 10));
    const { preencherRecuperacao } = require('./preencher-recuperacao.js');
    const rr = await preencherRecuperacao(c, mat, rec.toFixed(1).replace('.', ','));
    console.log('Completado com Recuperacao=' + rec + ' ->', JSON.stringify(rr));
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
