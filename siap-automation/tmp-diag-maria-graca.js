const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  console.log('url:', await cdp.evaluate(c, 'location.href'));
  const mat = '25128336445';
  const titulos = await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.lista.listaDeTotais .cabecalho .titulo, .titulo')).map(function(e){return e.textContent.trim();}))`);
  console.log('titulos:', titulos);

  // Atividades Avaliativas (subjetiva)
  const subj = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input');
    return el ? el.value : 'NAO-ACHOU';
  })()`);
  console.log('Atividades Avaliativas (raw input):', subj);

  // Av. Objetivas (media de blocos)
  const obj = await cdp.evaluate(c, `(function(){
    var els = document.querySelectorAll('.listaMediaObjetiva .item[data-matricula="${mat}"]');
    return JSON.stringify(Array.from(els).map(function(e){return e.textContent.trim();}));
  })()`);
  console.log('Objetivas:', obj);

  // Media Parcial e Bimestral
  ['Média Parcial', 'Média Bimestral', 'Recuperação'].forEach(async (titulo) => {});
  for (const titulo of ['Média Parcial', 'Média Bimestral', 'Recuperação']) {
    const v = await cdp.evaluate(c, `(function(){
      var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()===${JSON.stringify(titulo)};});
      if(!lst) return 'SEM-LISTA';
      var item = lst.querySelector('.item[data-matricula="${mat}"]');
      return item ? item.textContent.trim() : 'NAO-ACHOU';
    })()`);
    console.log(titulo + ':', v);
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
