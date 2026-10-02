const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const alunos = {
    JULIA: '26130296080',
    ALICIA: '22120728163',
    THIFANNY: '26131223489',
    LUCAS: '26131715155',
    JOAO_GABRIEL: '26130873558',
    SAMUEL: '23125635192',
    THAWANNY: '26130252517',
  };
  for (const [nome, mat] of Object.entries(alunos)) {
    const mp = await cdp.evaluate(c, `(function(){
      var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
      var item = lst.querySelector('.item[data-matricula="${mat}"]');
      return item ? item.textContent.trim() : 'NAO-ACHOU';
    })()`);
    console.log(nome, '|', mat, '| MP:', mp);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
