const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, setNotaAtividade, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';
const mat = '24126941341';

async function main() {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['3'], '3A', nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(4000);
  const c = await cdp.connect(AUTOMATION_TAB);
  const indice = await acharIndiceAvaliacao(c);
  const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input')?.value`);
  console.log('Atividade atual:', atual);
  // varrer valores pra achar o que maximiza o parcial sem passar de 7 (alvo original)
  const candidatos = [];
  for (let nota = 5; nota <= 10; nota += 0.5) {
    const parcial = await setNotaAtividade(c, indice, mat, nota);
    candidatos.push({ nota, parcial });
    console.log(`nota=${nota} -> parcial=${parcial}`);
  }
  // escolhe o candidato com maior parcial que nao ultrapasse 7, senao o mais proximo de 7 por cima
  const abaixoOuIgual = candidatos.filter(c => c.parcial <= 7.05).sort((a, b) => b.parcial - a.parcial);
  const melhor = abaixoOuIgual[0] || candidatos.sort((a, b) => Math.abs(a.parcial - 7) - Math.abs(b.parcial - 7))[0];
  console.log('Melhor candidato:', JSON.stringify(melhor));
  const parcialFinal = await setNotaAtividade(c, indice, mat, melhor.nota);
  console.log('Aplicado nota=' + melhor.nota + ' -> parcial final=' + parcialFinal);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
