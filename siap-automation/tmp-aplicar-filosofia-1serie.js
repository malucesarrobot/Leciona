const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function processar(letra, alunos, log) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['1'], '1' + letra, nav.DISCIPLINA.Filosofia);
  await cdp.waitMs(3500);
  const c = await cdp.connect();
  const indice = await acharIndiceAvaliacao(c);
  for (const al of alunos) {
    try {
      if (al.via === 'recuperacao') {
        const r = await preencherRecuperacao(c, al.mat, '9,0');
        log(`${al.nome}: recuperacao 9,0 -> ${r.valorFinal}`);
      } else {
        const atual = await cdp.evaluate(c, `(function(){
          var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
          return el ? el.value : null;
        })()`);
        const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
        const r = await arredondarPara(c, indice, al.mat, al.alvo, 0, notaInicial, () => {});
        log(`${al.nome}: bonus alvo=${al.alvo} -> parcial=${r.parcialFinal}`);
      }
    } catch (e) {
      log(`${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  const alunos1A = [
    { nome: 'MariaSophia', mat: '26130164180', via: 'recuperacao' },
    { nome: 'Gabrielle', mat: '26130448166', via: 'bonus', alvo: 9.0 },
    { nome: 'AnaBeatriz', mat: '26130430648', via: 'bonus', alvo: 7.5 },
    { nome: 'Sabrina', mat: '24127184321', via: 'bonus', alvo: 6.9 },
  ];
  const alunos1B = [
    { nome: 'VictorLucas', mat: '26129979096', via: 'recuperacao' },
    { nome: 'Thawanny', mat: '26130252517', via: 'recuperacao' },
    { nome: 'JoaoGabriel', mat: '26130873558', via: 'bonus', alvo: 6.8 },
    { nome: 'Isabella', mat: '26129977374', via: 'bonus', alvo: 7.2 },
    { nome: 'Lailla', mat: '26129971560', via: 'bonus', alvo: 8.7 },
    { nome: 'Lucas', mat: '26131715155', via: 'bonus', alvo: 10 },
    { nome: 'AnaClara', mat: '26131647000', via: 'bonus', alvo: 9.9 },
  ];
  console.log('=== 1A ===');
  await processar('A', alunos1A, (m) => console.log(' ', m));
  console.log('=== 1B ===');
  await processar('B', alunos1B, (m) => console.log(' ', m));
  console.log('FEITO');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
