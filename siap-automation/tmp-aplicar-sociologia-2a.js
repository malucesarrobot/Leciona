const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

async function main() {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2A', nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(3500);
  const c = await cdp.connect();
  const indice = await acharIndiceAvaliacao(c);
  const alunos = [
    { nome: 'Beatriz', mat: '25128397825', alvo: 6.5 },
    { nome: 'MariaClara', mat: '21119625347', alvo: 6.5 },
    { nome: 'Mariana', mat: '25128104064', alvo: 6.5 },
    { nome: 'Raiane', mat: '25128512989', alvo: 8.6 },
    { nome: 'Daniely', mat: '25128944032', alvo: 9.2 },
    { nome: 'Yuri', mat: '25128528785', alvo: 6.8 },
    { nome: 'Reinan', mat: '25128108473', alvo: 10 },
    { nome: 'Hevellyn', mat: '25128189985', alvo: 10 },
    { nome: 'Leticia', mat: '21119081136', alvo: 10 },
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
