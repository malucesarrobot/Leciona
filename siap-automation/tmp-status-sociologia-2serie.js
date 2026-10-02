const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function lerTurma(letra) {
  const c0 = await cdp.connect();
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await nav.navigateToNotas(c0, nav.SERIE['2'], '2' + letra, nav.DISCIPLINA.Sociologia);
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
    '25128397825':'Beatriz', '25128092056':'Carlos', '21120550256':'Luana',
    '21119625347':'MariaClara', '25129114165':'Guilherme', '21119081136':'Leticia',
    '25128512989':'Raiane', '25128944032':'Daniely', '25128528785':'Yuri',
    '25128108473':'Reinan', '25128189985':'Hevellyn', '25128104064':'Mariana',
  };
  for (const letra of ['A','B']) {
    const dados = await lerTurma(letra);
    console.log('=== 2' + letra + ' ===');
    Object.entries(mats).forEach(([mat,nome]) => {
      if (dados[mat]) console.log(nome, '|', mat, '| MB:', dados[mat]);
    });
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
