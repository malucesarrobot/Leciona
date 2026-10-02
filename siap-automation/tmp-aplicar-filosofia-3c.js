const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function main() {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['3'], '3C', nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(4000);
  const c = await cdp.connect();
  const indice = await acharIndiceAvaliacao(c);

  const recovery = [
    { nome: 'Daniel', mat: '24127200687' },
    { nome: 'Kimberly', mat: '24126667727' },
    { nome: 'Davi', mat: '24126088581' },
  ];
  for (const al of recovery) {
    try {
      const r = await preencherRecuperacao(c, al.mat, '9,0');
      console.log(al.nome + ': recuperacao 9,0 -> ' + r.valorFinal);
    } catch (e) { console.log(al.nome + ': ERRO -> ' + e.message); }
  }

  const bonus = [
    { nome: 'MariaEduarda', mat: '24127191622', alvo: 8.1 },
    { nome: 'Debora', mat: '24126268277', alvo: 8.7 },
  ];
  for (const al of bonus) {
    try {
      const atual = await cdp.evaluate(c, `(function(){
        var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
        return el ? el.value : null;
      })()`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
      const r = await arredondarPara(c, indice, al.mat, al.alvo, 0, notaInicial, () => {});
      console.log(al.nome + ': bonus alvo=' + al.alvo + ' -> parcial=' + r.parcialFinal);
    } catch (e) { console.log(al.nome + ': ERRO -> ' + e.message); }
  }
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
