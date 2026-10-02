const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function main() {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['3'], '3B', nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(3500);
  const c = await cdp.connect();
  const indice = await acharIndiceAvaliacao(c);

  const recovery = [
    { nome: 'Erika', mat: '22122278909' },
    { nome: 'Mayckon', mat: '25129232285' },
    { nome: 'Kevin', mat: '24126295214' },
    { nome: 'Thaina', mat: '20117731298' },
  ];
  for (const al of recovery) {
    try {
      const r = await preencherRecuperacao(c, al.mat, '9,0');
      console.log(al.nome + ': recuperacao 9,0 -> ' + r.valorFinal);
    } catch (e) { console.log(al.nome + ': ERRO -> ' + e.message); }
  }

  try {
    const atual = await cdp.evaluate(c, `(function(){
      var el = document.querySelector('.item.subjetiva.nota[data-matricula="24127146140"] input');
      return el ? el.value : null;
    })()`);
    const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
    const r = await arredondarPara(c, indice, '24127146140', 6.8, 0, notaInicial, () => {});
    console.log('Heloisa: bonus alvo=6.8 -> parcial=' + r.parcialFinal);
  } catch (e) { console.log('Heloisa: ERRO -> ' + e.message); }
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
