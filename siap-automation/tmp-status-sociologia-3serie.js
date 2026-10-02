const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function lerTurma(letra) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['3'], '3' + letra, nav.DISCIPLINA.Sociologia);
  await cdp.waitMs(3500);
  const c = await cdp.connect();
  const dados = await cdp.evaluate(c, `(function(){
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    if(!lstMB) return JSON.stringify({erro:'sem-mb'});
    var out = {};
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      out[it.getAttribute('data-matricula')] = it.textContent.trim();
    });
    return JSON.stringify(out);
  })()`);
  return JSON.parse(dados);
}

async function main() {
  const mats = {
    '24127191622':'MariaEduarda', '24127200687':'Daniel', '22122278909':'Erika',
    '24127984770':'Iago', '23127125743':'Laysa', '23127123544':'JoaoVitor',
    '25129232285':'Mayckon', '24126667727':'Kimberly', '24127146140':'Heloisa',
    '24126088581':'Davi', '24126295214':'Kevin', '20117731298':'Thaina',
    '23127134100':'Caroline',
  };
  for (const letra of ['A','B','C']) {
    const dados = await lerTurma(letra);
    console.log('=== 3' + letra + ' ===');
    Object.entries(mats).forEach(([mat,nome]) => {
      if (dados[mat]) console.log(nome, '|', mat, '| MB:', dados[mat]);
    });
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
