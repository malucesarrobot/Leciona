const fs = require('fs');
const cdp = require('./cdp.js');
const nav = require('./nav.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

const alunosData = JSON.parse(fs.readFileSync('/tmp/alunos_fresh.json'));
const matToNome = {};
Object.values(alunosData).forEach(a => {
  if (a.matricula) matToNome[a.matricula] = a.nome;
});

function parseVirgula(s) { return parseFloat(String(s).replace(',', '.')); }

async function navegarComRetry(fn) {
  for (let i = 0; i < 4; i++) {
    try {
      await fn();
      return;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
      if (i === 3) throw e;
    }
  }
}

async function lerTurma(serieValue, turmaLetra, discValue, opts) {
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
    var recs = {};
    Array.from(document.querySelectorAll('.item.recuperacao.nota')).forEach(function(r){
      var inp = r.querySelector('input');
      recs[r.getAttribute('data-matricula')] = inp ? inp.value : '';
    });
    if (!lstMB) return null;
    var out = {};
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      var mpEl = lstMP ? lstMP.querySelector('.item[data-matricula="'+mat+'"]') : null;
      out[mat] = { mb: it.textContent.trim(), mp: mpEl ? mpEl.textContent.trim() : '', rec: recs[mat] || '' };
    });
    return JSON.stringify(out);
  })()`);
  let t = 0;
  while (!dados && t < 5) { await cdp.waitMs(1200); c = await cdp.connect(AUTOMATION_TAB); dados = await cdp.evaluate(c, `(function(){
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var lstMP = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var recs = {};
    Array.from(document.querySelectorAll('.item.recuperacao.nota')).forEach(function(r){
      var inp = r.querySelector('input');
      recs[r.getAttribute('data-matricula')] = inp ? inp.value : '';
    });
    if (!lstMB) return null;
    var out = {};
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      var mpEl = lstMP ? lstMP.querySelector('.item[data-matricula="'+mat+'"]') : null;
      out[mat] = { mb: it.textContent.trim(), mp: mpEl ? mpEl.textContent.trim() : '', rec: recs[mat] || '' };
    });
    return JSON.stringify(out);
  })()`); t++; }
  return dados ? JSON.parse(dados) : {};
}

async function main() {
  const turmas = [
    ['1', 'A', 'Filosofia'], ['1', 'B', 'Filosofia'],
    ['1', 'A', 'Historia'], ['1', 'B', 'Historia'],
    ['1', 'A', 'Sociologia'], ['1', 'B', 'Sociologia'],
    ['2', 'A', 'Filosofia'], ['2', 'B', 'Filosofia'],
    ['2', 'A', 'Historia'], ['2', 'B', 'Historia'],
    ['2', 'A', 'Sociologia'], ['2', 'B', 'Sociologia'],
    ['3', 'A', 'Filosofia'], ['3', 'B', 'Filosofia'], ['3', 'C', 'Filosofia'],
    ['3', 'A', 'Historia'], ['3', 'B', 'Historia'], ['3', 'C', 'Historia'],
    ['3', 'A', 'Sociologia'], ['3', 'B', 'Sociologia'], ['3', 'C', 'Sociologia'],
  ];
  const abaixo = [];
  for (const [serie, letra, discNome] of turmas) {
    const turmaLetra = serie + letra;
    const discValue = nav.DISCIPLINA[discNome];
    console.log(`=== ${turmaLetra} ${discNome} ===`);
    try {
      const dados = await lerTurma(nav.SERIE[serie], turmaLetra, discValue);
      Object.entries(dados).forEach(([mat, info]) => {
        const mbNum = parseVirgula(info.mb);
        if (!isNaN(mbNum) && mbNum < 6) {
          abaixo.push({ turma: turmaLetra, disc: discNome, mat, nome: matToNome[mat] || '???', mb: info.mb, mp: info.mp, rec: info.rec });
        }
      });
    } catch (e) {
      console.log(`  ERRO turma inteira: ${e.message}`);
    }
  }
  // 9º ano CEPI
  for (const letra of ['A', 'C']) {
    const turmaLetra = '9' + letra;
    console.log(`=== ${turmaLetra} Historia (CEPI) ===`);
    try {
      const dados = await lerTurma(nav.CEPI.serie9, turmaLetra, nav.DISCIPLINA.Historia, { composicao: nav.CEPI.composicao, turno: nav.CEPI.turno });
      Object.entries(dados).forEach(([mat, info]) => {
        const mbNum = parseVirgula(info.mb);
        if (!isNaN(mbNum) && mbNum < 6) {
          abaixo.push({ turma: turmaLetra, disc: 'Historia(CEPI)', mat, nome: matToNome[mat] || '???', mb: info.mb, mp: info.mp, rec: info.rec });
        }
      });
    } catch (e) {
      console.log(`  ERRO turma inteira: ${e.message}`);
    }
  }
  console.log('\\n=== RESULTADO: ABAIXO DA MEDIA ===');
  abaixo.forEach(a => console.log(`${a.turma} | ${a.disc} | ${a.nome} (${a.mat}) | MB=${a.mb} MP=${a.mp} Rec="${a.rec}"`));
  fs.writeFileSync('/tmp/auditoria-abaixo-media.json', JSON.stringify(abaixo, null, 2));
  console.log('FIM. Total abaixo da media:', abaixo.length);
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
