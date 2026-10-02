const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function processar(letra, alunos, log) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2' + letra, nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const indice = await acharIndiceAvaliacao(c);
  const resultados = [];
  for (const al of alunos) {
    if (al.via === 'recuperacao') {
      const r = await preencherRecuperacao(c, al.mat, '9,0');
      log(`${al.nome}: recuperacao 9,0 -> ${r.valorFinal}`);
      resultados.push({ nome: al.nome, via: 'recuperacao', valor: r.valorFinal });
    } else {
      const atual = await cdp.evaluate(c, `(function(){
        var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
        return el ? el.value : null;
      })()`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
      const r = await arredondarPara(c, indice, al.mat, al.alvo, 0, notaInicial, () => {});
      log(`${al.nome}: bonus alvo=${al.alvo} -> parcial=${r.parcialFinal}`);
      resultados.push({ nome: al.nome, via: 'bonus', alvo: al.alvo, final: r.parcialFinal });
    }
  }
  return resultados;
}

async function main() {
  const alunos2A = [
    { nome: 'Beatriz', mat: '25128397825', via: 'recuperacao' },
    { nome: 'MariaClara', mat: '21119625347', via: 'recuperacao' },
    { nome: 'Mariana', mat: '25128104064', via: 'recuperacao' },
    { nome: 'Leticia', mat: '21119081136', via: 'bonus', alvo: 8.3 },
    { nome: 'Raiane', mat: '25128512989', via: 'bonus', alvo: 9.1 },
    { nome: 'Daniely', mat: '25128944032', via: 'bonus', alvo: 9.3 },
    { nome: 'Yuri', mat: '25128528785', via: 'bonus', alvo: 8.2 },
    { nome: 'Reinan', mat: '25128108473', via: 'bonus', alvo: 7.2 },
    { nome: 'Isabella', mat: '25128290876', via: 'bonus', alvo: 10 },
    { nome: 'Walisson', mat: '25128456312', via: 'bonus', alvo: 6.8 },
  ];
  const alunos2B = [
    { nome: 'Carlos', mat: '25128092056', via: 'bonus', alvo: 8.7 },
    { nome: 'Luana', mat: '21120550256', via: 'bonus', alvo: 6.9 },
    { nome: 'Yago', mat: '25128198782', via: 'bonus', alvo: 6.9 },
    { nome: 'Julia', mat: '25128472013', via: 'recuperacao' },
  ];
  console.log('=== 2A ===');
  const r1 = await processar('A', alunos2A, (m) => console.log(' ', m));
  console.log('=== 2B ===');
  const r2 = await processar('B', alunos2B, (m) => console.log(' ', m));
  require('fs').writeFileSync('/tmp/recomposicao_2serie_resultado.json', JSON.stringify({ r1, r2 }, null, 1));
  console.log('SALVO');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
