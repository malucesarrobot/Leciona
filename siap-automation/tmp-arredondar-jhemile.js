const cdp = require('./cdp.js');
const { acharIndiceAvaliacao, arredondarPara } = require('./arredondar-media.js');

async function main() {
  const c = await cdp.connect();
  const mat = '25129181901';
  const indice = await acharIndiceAvaliacao(c);
  console.log('indice:', indice);
  const atual = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input');
    return el ? el.value : null;
  })()`);
  console.log('atividades atual:', atual);
  const notaInicial = parseFloat((atual || '9').replace(',', '.'));
  const r = await arredondarPara(c, indice, mat, 10, 0, notaInicial + 0.3, (m) => console.log(' ', m));
  console.log('RESULTADO:', JSON.stringify(r));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
