const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function checarUm(serie, letra, disc, mat, nome) {
  const c0 = await cdp.connect();
  await nav.navigateToNotas(c0, nav.SERIE[serie], serie + letra, nav.DISCIPLINA[disc]);
  await cdp.waitMs(3000);
  const c = await cdp.connect();
  const mb = await cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    if(!lst) return 'SEM-LISTA';
    var item = lst.querySelector('.item[data-matricula="${mat}"]');
    return item ? item.textContent.trim() : 'NAO-ACHOU';
  })()`);
  const rec = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('.item.recuperacao.nota[data-matricula="${mat}"]');
    return el ? el.getAttribute('data-nota') : 'NAO-ACHOU';
  })()`);
  console.log(nome, '| MB:', mb, '| Rec:', rec);
}

async function main() {
  await checarUm('1', 'B', 'Sociologia', '26130806459', 'GILMAR ALMEIDA SANTOS');
  await checarUm('2', 'B', 'Sociologia', '25129114198', 'SABRINA VITÓRIA GONÇALVES DE SOUZA');
  await checarUm('3', 'B', 'Sociologia', '25129066470', 'GABRIELY VITÓRIA FELIX DE SOUZA');
  await checarUm('3', 'C', 'Historia', '24126210528', 'KAUA DA SILVA MACIEL');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
