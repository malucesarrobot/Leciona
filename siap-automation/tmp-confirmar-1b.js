const cdp = require('./cdp.js');
const nav = require('./nav.js');
async function main() {
  const c = await cdp.connect();
  await nav.navigateToNotas(c, nav.SERIE['1'], '1B', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c2 = await cdp.connect();
  console.log('url:', await cdp.evaluate(c2, 'location.href'));
  const alunos = {
    JULIA: '26130296080',
    ALICIA: '22120728163',
    THIFANNY: '26131223489',
    LUCAS: '26131715155',
    JOAO_GABRIEL: '26130873558',
    SAMUEL: '23125635192',
    THAWANNY: '26130252517',
  };
  const resultado = {};
  for (const [nome, mat] of Object.entries(alunos)) {
    const rec = await cdp.evaluate(c2, `(function(){
      var el = document.querySelector('.item.recuperacao.nota[data-matricula="${mat}"]');
      return el ? el.getAttribute('data-nota') : 'NAO-ACHOU';
    })()`);
    const mb = await cdp.evaluate(c2, `(function(){
      var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
      var item = lst.querySelector('.item[data-matricula="${mat}"]');
      return item ? item.textContent.trim() : 'NAO-ACHOU';
    })()`);
    console.log(nome, '| Rec:', rec, '| MB:', mb);
    resultado[mat] = { mb };
  }
  require('fs').writeFileSync('/tmp/mb_1b_check.json', JSON.stringify(resultado));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
