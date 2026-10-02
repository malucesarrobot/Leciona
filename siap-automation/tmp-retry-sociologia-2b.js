const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

async function main() {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2B', nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(4000);
  let c = await cdp.connect();
  let indice = await acharIndiceAvaliacao(c);
  let tentativasIndice = 0;
  while (!indice && tentativasIndice < 5) {
    await cdp.waitMs(1500);
    c = await cdp.connect();
    indice = await acharIndiceAvaliacao(c);
    tentativasIndice++;
  }
  if (!indice) { console.log('FALHA: indiceAvaliacao continua null após retries'); process.exit(1); }
  console.log('indice OK:', indice);

  const alunos = [
    { nome: 'Stefhany', mat: '25128142697', alvo: 6.5 },
    { nome: 'Yasmin', mat: '25128473548', alvo: 7.5 },
    { nome: 'Hiarles', mat: '25128097107', alvo: 9.3 },
    { nome: 'Emilly', mat: '23125613134', alvo: 7.0 },
    { nome: 'LucasOliveira', mat: '25128336423', alvo: 10 },
    { nome: 'PedroOliveira', mat: '25129114267', alvo: 8.1 },
  ];
  for (const al of alunos) {
    try {
      const atual = await cdp.evaluate(c, `(function(){
        var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
        return el ? el.value : null;
      })()`);
      if (atual === null) { console.log(al.nome + ': ERRO -> input não encontrado na página (matrícula errada ou não está nessa turma)'); continue; }
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1.5);
      const r = await arredondarPara(c, indice, al.mat, al.alvo, 0, notaInicial, () => {});
      console.log(al.nome + ': alvo=' + al.alvo + ' -> parcial=' + r.parcialFinal);
    } catch (e) { console.log(al.nome + ': ERRO -> ' + e.message); }
  }
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
