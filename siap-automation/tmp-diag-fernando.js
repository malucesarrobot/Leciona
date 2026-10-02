const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  console.log('url:', await cdp.evaluate(c, 'location.href'));
  const mat = '26129970400';
  const sel = `.item.recuperacao.nota[data-matricula="${mat}"] input`;
  const existe = await cdp.evaluate(c, `!!document.querySelector('${sel}')`);
  console.log('campo existe agora:', existe);
  const val = await cdp.evaluate(c, `(function(){var el=document.querySelector('${sel}'); return el ? el.value : 'SEM-CAMPO';})()`);
  console.log('valor atual:', val);
}
main().catch(e => { console.error(e.message); process.exit(1); });
