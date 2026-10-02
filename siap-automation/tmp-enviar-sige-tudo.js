const fs = require('fs');
const cdp = require('./cdp.js');
const nav = require('./nav.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';
const alunosData = JSON.parse(fs.readFileSync('/tmp/alunos_fresh.json'));
const matToNome = {};
Object.values(alunosData).forEach(a => { if (a.matricula) matToNome[a.matricula] = a.nome; });

function parseVirgula(s) { return parseFloat(String(s).replace(',', '.')); }

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

async function lerNotasCompletas(c, mats) {
  return cdp.evaluate(c, `(function(){
    var listas = Array.from(document.querySelectorAll('.lista.listaDeNotas, .lista.listaDeTotais'));
    var lstMB = listas.find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    if (!lstMB) return null;
    var out = {};
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      out[mat] = { mb: it.textContent.trim(), instrumentos: {} };
    });
    listas.forEach(function(l){
      var t = l.querySelector('.cabecalho .titulo');
      var nomeInst = t ? t.textContent.trim() : (l.getAttribute('title')||'');
      if (!nomeInst || nomeInst === 'Média Bimestral') return;
      Array.from(l.querySelectorAll('.item[data-matricula]')).forEach(function(it){
        var mat = it.getAttribute('data-matricula');
        if (!out[mat]) return;
        var inp = it.querySelector('input');
        var val = inp ? inp.value : it.textContent.trim();
        out[mat].instrumentos[nomeInst] = val;
      });
    });
    return JSON.stringify(out);
  })()`);
}

async function enviarSige(c) {
  await cdp.click(c, '#cphFuncionalidade_cphCampos_btnEnviarBoletim');
  await cdp.waitMs(1800);
  const c2 = await cdp.connect(AUTOMATION_TAB);
  await cdp.click(c2, '#cphFuncionalidade_cphCampos_btnSim');
  await cdp.waitMs(1800);
}

async function processarTurma(serieValue, turmaLetra, discValue, discNome, opts) {
  await navegarComRetry(async () => {
    const c0 = await cdp.connect(AUTOMATION_TAB);
    await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
    await nav.navigateToNotas(c0, serieValue, turmaLetra, discValue, opts);
    await cdp.waitMs(3500);
  });
  let c = await cdp.connect(AUTOMATION_TAB);
  let dados = await lerNotasCompletas(c);
  let t = 0;
  while (!dados && t < 5) { await cdp.waitMs(1200); c = await cdp.connect(AUTOMATION_TAB); dados = await lerNotasCompletas(c); t++; }
  const parsed = dados ? JSON.parse(dados) : {};

  const abaixo = [];
  Object.entries(parsed).forEach(([mat, info]) => {
    const mbNum = parseVirgula(info.mb);
    if (!isNaN(mbNum) && mbNum < 6) {
      const zeros = Object.entries(info.instrumentos).filter(([k, v]) => {
        const n = parseVirgula(v);
        return v !== '' && !isNaN(n) && n === 0;
      }).map(([k]) => k);
      abaixo.push({ turma: turmaLetra, disc: discNome, mat, nome: matToNome[mat] || '???', mb: info.mb, zeros });
    }
  });

  try {
    await enviarSige(c);
    console.log(`${turmaLetra} ${discNome}: ENVIADO AO SIGE OK`);
  } catch (e) {
    console.log(`${turmaLetra} ${discNome}: ERRO AO ENVIAR -> ${e.message}`);
  }
  return abaixo;
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
  let todosAbaixo = [];
  for (const [serie, letra, discNome] of turmas) {
    const turmaLetra = serie + letra;
    const discValue = nav.DISCIPLINA[discNome];
    try {
      const abaixo = await processarTurma(nav.SERIE[serie], turmaLetra, discValue, discNome);
      todosAbaixo = todosAbaixo.concat(abaixo);
    } catch (e) {
      console.log(`${turmaLetra} ${discNome}: ERRO TURMA INTEIRA -> ${e.message}`);
    }
  }
  // 9 ano CEPI
  for (const letra of ['A', 'C']) {
    const turmaLetra = '9' + letra;
    try {
      const abaixo = await processarTurma(nav.CEPI.serie9, turmaLetra, nav.DISCIPLINA.Historia, 'Historia(CEPI)', { composicao: nav.CEPI.composicao, turno: nav.CEPI.turno });
      todosAbaixo = todosAbaixo.concat(abaixo);
    } catch (e) {
      console.log(`${turmaLetra} Historia(CEPI): ERRO TURMA INTEIRA -> ${e.message}`);
    }
  }
  console.log('\\n=== ABAIXO DE 6 (apos envio ao SIGE) ===');
  todosAbaixo.forEach(a => {
    const zeroTxt = a.zeros.length ? ` | ZERO EM: ${a.zeros.join(', ')}` : '';
    console.log(`${a.turma} | ${a.disc} | ${a.nome} (${a.mat}) | MB=${a.mb}${zeroTxt}`);
  });
  fs.writeFileSync('/tmp/relatorio-pos-sige.json', JSON.stringify(todosAbaixo, null, 2));
  console.log('FIM. Total abaixo de 6:', todosAbaixo.length);
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
