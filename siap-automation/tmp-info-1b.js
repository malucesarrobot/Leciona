const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const roster = await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeAlunos .item')).map(function(e){return {nome:(e.getAttribute('data-nome')||e.innerText||'').trim(), matricula:e.getAttribute('data-matricula')};}))`);
  require('fs').writeFileSync('/tmp/roster_1b.json', roster);
  console.log('roster salvo, tamanho:', roster.length);
}
main().catch(e => { console.error(e.message); process.exit(1); });
