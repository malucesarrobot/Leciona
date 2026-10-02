const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function lerTurma(disc, letra) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2' + letra, nav.DISCIPLINA[disc]);
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
    '25129114154':'Felipe', '25128201264':'Kaua', '25128473548':'Yasmin',
    '25128118422':'Thalis', '25128228067':'Eric', '25128142697':'Stefhany',
    '21119051339':'AnaPaula', '25128097107':'Hiarles', '23125613134':'Emilly',
    '25128336423':'LucasOliveira', '25128396323':'Marcella', '25129114267':'PedroOliveira',
    '25128421012':'IsabellaDamasceno', '25128173624':'Byanca', '25128290876':'IsabellaDantas',
    '25128456312':'Walisson', '25128198782':'Yago', '25128472013':'Julia',
    '25128277856':'SamuelLucas',
  };
  for (const disc of ['Filosofia', 'Sociologia']) {
    for (const letra of ['A', 'B']) {
      const dados = await lerTurma(disc, letra);
      console.log('=== ' + disc + ' 2' + letra + ' ===');
      Object.entries(mats).forEach(([mat, nome]) => {
        if (dados[mat]) console.log(nome, '|', mat, '| MB:', dados[mat]);
      });
    }
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
