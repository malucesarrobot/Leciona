const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
const { acharIndiceAvaliacao, setNotaAtividade, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';

function calcRec(parcial, alvo) {
  const r = Math.round((2 * alvo - parcial) * 10) / 10;
  return Math.max(0, Math.min(10, r));
}

async function processarTurma(serieKey, turmaLetra, disc, alunos) {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE[serieKey], turmaLetra, disc);
  await cdp.waitMs(4000);
  const c = await cdp.connect(AUTOMATION_TAB);
  for (const al of alunos) {
    try {
      const rec = calcRec(al.parcialAtual, al.alvo);
      const recTexto = rec.toFixed(1).replace('.', ',');
      await preencherRecuperacao(c, al.mat, recTexto);
      await cdp.waitMs(600);
      console.log(`${turmaLetra} ${al.nome}: parcial=${al.parcialAtual} alvo=${al.alvo} -> rec=${recTexto} (MB esperado=${((al.parcialAtual+rec)/2).toFixed(1)})`);
    } catch (e) {
      console.log(`${turmaLetra} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  // Sociologia 2A
  await processarTurma('2', '2A', nav.DISCIPLINA.Sociologia, [
    { nome: 'Byanca', mat: '25128173624', parcialAtual: 5.2, alvo: 6.5 },
    { nome: 'Walisson', mat: '25128456312', parcialAtual: 7.2, alvo: 7.9 },
  ]);
  // Filosofia 2B
  await processarTurma('2', '2B', nav.DISCIPLINA.Filosofia, [
    { nome: 'Yasmin', mat: '25128473548', parcialAtual: 5.8, alvo: 6.5 },
    { nome: 'Stefhany', mat: '25128142697', parcialAtual: 5.2, alvo: 6.5 },
    { nome: 'Marcella', mat: '25128396323', parcialAtual: 5.2, alvo: 6.5 },
  ]);
  // Sociologia 2B
  await processarTurma('2', '2B', nav.DISCIPLINA.Sociologia, [
    { nome: 'Stefhany', mat: '25128142697', parcialAtual: 5.0, alvo: 6.5 },
    { nome: 'Yasmin', mat: '25128473548', parcialAtual: 6.7, alvo: 7.5 },
    { nome: 'LucasOliveira', mat: '25128336423', parcialAtual: 9.3, alvo: 10 },
  ]);
  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
