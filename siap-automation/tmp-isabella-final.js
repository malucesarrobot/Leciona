const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';
const mat = '25128421012';
const alvo = 8.3;

async function main() {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2A', nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(4000);
  const c = await cdp.connect(AUTOMATION_TAB);
  const indice = await acharIndiceAvaliacao(c);
  const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input')?.value`);
  console.log('Atividade atual real:', atual);
  const r = await arredondarPara(c, indice, mat, alvo, 0, Math.min(10, parseVirgula(atual || '5') + 2), () => {});
  console.log('Depois de subir Atividades: parcial=' + r.parcialFinal);
  if (Math.abs(r.parcialFinal - alvo) > 0.05) {
    const rec = Math.max(0, Math.min(10, Math.round((2 * alvo - r.parcialFinal) * 10) / 10));
    const recTexto = rec.toFixed(1).replace('.', ',');
    await preencherRecuperacao(c, mat, recTexto);
    await cdp.waitMs(600);
    console.log(`Completado com Recuperação=${recTexto} -> MB esperado=${((r.parcialFinal + rec) / 2).toFixed(1)}`);
  } else {
    console.log('Bateu o alvo só com Atividades, sem precisar de Recuperação.');
  }
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
