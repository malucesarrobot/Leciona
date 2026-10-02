const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';
const mat = '25128281810';

async function navegarComRetry(discValue) {
  for (let i = 0; i < 4; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE['2'], '2A', discValue);
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
  const indice = await acharIndiceAvaliacao(c);
  // Rec ja esta em 9,0. Precisa MP>=3 pra bater 6 com rec=9. Vamos tentar Rec=10 (max) + subir Atividades o quanto der.
  const r = await arredondarPara(c, indice, mat, 6.0, 9.0, 10, () => {});
  console.log(`${discNome}: subindo Atividades (rec=9,0) -> parcial=${r.parcialFinal}, MB=${Math.max(r.parcialFinal,(r.parcialFinal+9)/2).toFixed(1)}`);
  if ((r.parcialFinal + 9) / 2 < 6) {
    const rr = await preencherRecuperacao(c, mat, '10,0');
    console.log(`${discNome}: subindo Recuperacao pra 10,0 ->`, JSON.stringify(rr));
    console.log(`${discNome}: MB esperado agora = ${((r.parcialFinal + 10) / 2).toFixed(1)}`);
  }
}

async function main() {
  await corrigir('Filosofia', nav.DISCIPLINA.Filosofia);
  await corrigir('Sociologia', nav.DISCIPLINA.Sociologia);
  console.log('FIM');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
