const cdp = require('./cdp.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

async function main() {
  const c = await cdp.connect();
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});
  const indice = await acharIndiceAvaliacao(c);
  const alunos = [
    { nome: 'Daniel', mat: '24127200687' },
    { nome: 'Kimberly', mat: '24126667727' },
    { nome: 'Davi', mat: '24126088581' },
  ];
  for (const al of alunos) {
    try {
      const atual = await cdp.evaluate(c, `(function(){
        var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
        return el ? el.value : null;
      })()`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 2);
      const r = await arredondarPara(c, indice, al.mat, 6.5, 0, notaInicial, () => {});
      console.log(al.nome + ': alvo=6.5 -> parcial=' + r.parcialFinal);
    } catch (e) { console.log(al.nome + ': ERRO -> ' + e.message); }
  }
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
