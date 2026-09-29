/* Lança presença/falta retroativa em datas específicas do 3º bimestre pra
   alunos de atestado médico, sem mexer na frequência dos colegas — só
   alterna a(s) matrícula(s) alvo em cada dia, preservando quem já estava
   marcado ausente por outro motivo. Reaproveita o padrão de clique
   paciente + clickAndVerify + btnAlterar de freq-hoje.js. */
const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

function toCanonELabel(dataISO) {
  const [y, m, d] = dataISO.split('-').map(Number);
  return { canon: `${y}/${m}/${d}`, label: `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`, mesNum: m };
}
const MESES = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

async function processarData(c, dataISO, alvos, log) {
  const { canon, label } = toCanonELabel(dataISO);
  const tdInfo = await cdp.evaluate(c, `(function(){ const td=document.querySelector('td[data-canonica="${canon}"]'); return td?JSON.stringify({cls:td.className}):'NAO-ACHADA'; })()`);
  if (tdInfo === 'NAO-ACHADA') { log(`${dataISO}: celula nao encontrada`); return { data: dataISO, status: 'CELULA-NAO-ACHADA' }; }
  const td = JSON.parse(tdInfo);
  if (!/dialog letivo/.test(td.cls)) { log(`${dataISO}: nao letivo, pulando`); return { data: dataISO, status: 'NAO-LETIVO' }; }

  const ok = await nav.gotoDate(c, canon, label);
  if (!ok) { log(`${dataISO}: falhou abrir dia`); return { data: dataISO, status: 'FALHOU-ABRIR' }; }

  // txtDataSelecionada confirma rapido, mas o painel .listaDeFrequencias
  // (lista de alunos com data-ausente) carrega por outra chamada AJAX
  // separada e mais lenta — espera ele de verdade aparecer.
  let painelOk = false;
  for (let i = 0; i < 10; i++) {
    const tem = await cdp.evaluate(c, `!!document.querySelector('.listaDeFrequencias .item[data-matricula]')`);
    if (tem) { painelOk = true; break; }
    await cdp.waitMs(700);
  }
  if (!painelOk) { log(`${dataISO}: painel de frequencia nao carregou`); return { data: dataISO, status: 'FALHOU-PAINEL' }; }

  for (const { matricula, falta } of alvos) {
    const atualAusente = await cdp.evaluate(c, `document.querySelector('.listaDeFrequencias .item[data-matricula="${matricula}"]')?.getAttribute('data-ausente')`);
    if (atualAusente === null) { log(`${dataISO}: matricula ${matricula} nao achada na lista`); continue; }
    const desejado = falta ? 'True' : 'False';
    if (atualAusente !== desejado) {
      await cdp.clickAndVerify(c, `.listaDeFrequencias .item[data-matricula="${matricula}"]`, 'data-ausente', desejado, 6);
    }
  }
  const temBotao = await cdp.evaluate(c, `!!document.querySelector('#cphFuncionalidade_btnAlterar')`);
  if (!temBotao) { log(`${dataISO}: botao Alterar nao encontrado`); return { data: dataISO, status: 'FALHOU-SEM-BOTAO' }; }
  await cdp.realClick(c, '#cphFuncionalidade_btnAlterar');
  // salvar dispara um postback que recarrega o calendario do mes — espera
  // a tabela voltar antes de deixar o proximo clique acontecer, senao a
  // celula do dia seguinte "some" por pegar o DOM no meio da troca.
  for (let i = 0; i < 12; i++) {
    await cdp.waitMs(700);
    const tem = await cdp.evaluate(c, `!!document.querySelector('table.mes')`);
    if (tem) break;
  }
  await cdp.waitMs(600);
  log(`${dataISO}: salvo`);
  return { data: dataISO, status: 'SALVO' };
}

async function main() {
  const arquivo = process.argv[3] || 'freq-atestado.json';
  const targetId = process.argv[2] || undefined;
  const cfg = JSON.parse(fs.readFileSync(__dirname + '/' + arquivo, 'utf8'));
  const c = await cdp.connect(targetId);
  const relatorioFinal = [];

  for (const turma of cfg) {
    console.log(`\n=== ${turma.label} ===`);
    // agrupa as datas por mes
    const porMes = {};
    for (const d of turma.datas) {
      const { mesNum } = toCanonELabel(d.data);
      (porMes[mesNum] = porMes[mesNum] || []).push(d);
    }
    const resultadoTurma = { label: turma.label, dias: [] };
    for (const mesNum of Object.keys(porMes).sort()) {
      await nav.navigateToFrequencia(c, nav.SERIE[turma.serie], turma.serie + turma.letra, nav.DISCIPLINA[turma.disc], MESES[mesNum]);
      // navigateToFrequencia troca o mes via AJAX que pode demorar mais que
      // o wait interno — espera de verdade a tabela do calendario bater com
      // o mes pedido antes de tentar clicar em qualquer celula dela.
      let mesOk = false;
      for (let i = 0; i < 12; i++) {
        const m = await cdp.evaluate(c, `document.querySelector('table.mes')?.getAttribute('mes')`);
        if (String(m) === String(mesNum)) { mesOk = true; break; }
        await cdp.waitMs(800);
      }
      console.log(`  mes ${MESES[mesNum]} confirmado? ${mesOk}`);
      for (const d of porMes[mesNum]) {
        const alvos = turma.alunos.map(mat => ({ matricula: mat, falta: d.falta }));
        try {
          const r = await processarData(c, d.data, alvos, (m) => console.log('  ' + m));
          resultadoTurma.dias.push(r);
        } catch (e) {
          console.log(`  ${d.data}: ERRO ${e.message}`);
          resultadoTurma.dias.push({ data: d.data, status: 'ERRO', erro: e.message });
        }
      }
    }
    relatorioFinal.push(resultadoTurma);
  }

  await cdp.close(c);
  console.log('\n=== RELATORIO FINAL ===');
  console.log(JSON.stringify(relatorioFinal, null, 1));
  fs.writeFileSync(__dirname + '/relatorio-freq-atestado.json', JSON.stringify(relatorioFinal, null, 1));
}
main().catch(e => { console.error('FALHOU GERAL:', e.message); process.exit(1); });
