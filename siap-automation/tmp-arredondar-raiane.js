const cdp = require('./cdp.js');
const { acharIndiceAvaliacao, arredondarPara } = require('./arredondar-media.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

async function main() {
  const c = await cdp.connect();
  const mat = '25128512989';
  const indice = await acharIndiceAvaliacao(c);
  console.log('indice:', indice);
  const atual = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input');
    return el ? el.value : null;
  })()`);
  console.log('atividades atual:', atual);
  const notaInicial = parseFloat((atual || '9').replace(',', '.'));
  const r = await arredondarPara(c, indice, mat, 10, 0, Math.min(10, notaInicial + 0.3), (m) => console.log(' ', m));
  console.log('RESULTADO ATIVIDADES:', JSON.stringify(r));
  if (Math.abs(r.parcialFinal - 10) > 0.05) {
    console.log('nao deu so com atividades, tentando recuperacao...');
    const rr = await preencherRecuperacao(c, mat, '10,0');
    console.log('recuperacao:', JSON.stringify(rr));
    const mb = await cdp.evaluate(c, `(function(){
      var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
      var item = lst.querySelector('.item[data-matricula="${mat}"]');
      return item ? item.textContent.trim() : 'NAO-ACHOU';
    })()`);
    console.log('MB final:', mb);
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
