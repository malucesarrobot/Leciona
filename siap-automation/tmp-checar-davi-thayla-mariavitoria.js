const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function navegarComRetry(fn) {
  for (let i = 0; i < 4; i++) {
    try { await fn(); return; }
    catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
      if (i === 3) throw e;
    }
  }
}

async function lerAluno(serieValue, turmaLetra, discValue, mat, opts) {
  await navegarComRetry(async () => {
    const c0 = await cdp.connect(AUTOMATION_TAB);
    await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
    await nav.navigateToNotas(c0, serieValue, turmaLetra, discValue, opts);
    await cdp.waitMs(4000);
  });
  let c = await cdp.connect(AUTOMATION_TAB);
  let dados = await cdp.evaluate(c, `(function(){
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var lstMP = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var recEl = document.querySelector('.item.recuperacao.nota[data-matricula="${mat}"] input');
    var subjEl = document.querySelector('.item.subjetiva.nota[data-matricula="${mat}"] input');
    var mbEl = lstMB ? lstMB.querySelector('.item[data-matricula="${mat}"]') : null;
    var mpEl = lstMP ? lstMP.querySelector('.item[data-matricula="${mat}"]') : null;
    var achouAluno = !!(mbEl || mpEl || subjEl);
    return JSON.stringify({ achouAluno: achouAluno, mb: mbEl ? mbEl.textContent.trim() : null, mp: mpEl ? mpEl.textContent.trim() : null, rec: recEl ? recEl.value : null, atividade: subjEl ? subjEl.value : null });
  })()`);
  let t = 0;
  while (!dados && t < 5) { await cdp.waitMs(1200); c = await cdp.connect(AUTOMATION_TAB); t++; }
  return dados ? JSON.parse(dados) : { erro: 'sem dados' };
}

async function main() {
  const alunos = [
    { nome: 'DaviPonciano', mat: '22122339130', turma: '3C', serie: '3' },
    { nome: 'ThaylaAlves', mat: '23127129959', turma: '3C', serie: '3' },
  ];
  for (const al of alunos) {
    for (const disc of ['Filosofia', 'Sociologia', 'Historia']) {
      try {
        const r = await lerAluno(nav.SERIE[al.serie], al.turma, nav.DISCIPLINA[disc], al.mat);
        console.log(`${al.nome} ${al.turma} ${disc}:`, JSON.stringify(r));
      } catch (e) {
        console.log(`${al.nome} ${al.turma} ${disc}: ERRO -> ${e.message}`);
      }
    }
  }
  // Maria Vitorya - 9C CEPI Historia
  try {
    const r = await lerAluno(nav.CEPI.serie9, '9C', nav.DISCIPLINA.Historia, '22121472043', { composicao: nav.CEPI.composicao, turno: nav.CEPI.turno });
    console.log('MariaVitorya 9C Historia(CEPI):', JSON.stringify(r));
  } catch (e) {
    console.log('MariaVitorya 9C Historia(CEPI): ERRO ->', e.message);
  }
  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
