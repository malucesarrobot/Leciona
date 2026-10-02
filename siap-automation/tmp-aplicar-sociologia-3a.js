const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

async function main() {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['3'], '3A', nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(3500);
  const c = await cdp.connect();
  const indice = await acharIndiceAvaliacao(c);
  const alunos = [
    { nome: 'JoaoVitor', mat: '23127123544', alvo: 6.5 },
    { nome: 'Laysa', mat: '23127125743', alvo: 8.0 },
    { nome: 'Caroline', mat: '23127134100', alvo: 8.5 },
  ];
  for (const al of alunos) {
    try {
      const atual = await cdp.evaluate(c, `(function(){
        var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
        return el ? el.value : null;
      })()`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1.5);
      const r = await arredondarPara(c, indice, al.mat, al.alvo, 0, notaInicial, () => {});
      console.log(al.nome + ': alvo=' + al.alvo + ' -> parcial=' + r.parcialFinal);
    } catch (e) { console.log(al.nome + ': ERRO -> ' + e.message); }
  }
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
