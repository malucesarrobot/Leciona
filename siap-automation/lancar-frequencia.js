/* Lança/corrige a frequência de uma turma-disciplina no SIAP pra TODAS as datas
   de chamada existentes no Leciona (fonte da verdade), navegando mês a mês.
   Idempotente: se a data já está correta no SIAP, não clica em nada (0 cliques,
   status 'JA-OK') — seguro rodar de novo quantas vezes for. */
const cdp = require('./cdp.js');
const nav = require('./nav.js');

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function toCanonELabel(dataISO) {
  const [y, m, d] = dataISO.split('-').map(Number);
  return {
    canon: `${y}/${m}/${d}`,
    label: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
    mes: MESES[m - 1],
  };
}

/* turmaData: {disciplina, serie: '1'|'2'|'3', letra: 'A'|'B'|'C', chamadas: [{data:'YYYY-MM-DD', faltas:['matricula',...]}]} */
async function lancarFrequenciaTurma(c, turmaData) {
  const DISC_ALIASES = { 'História': 'Historia', 'Estudo Orientado': 'EstudoOrientado' };
  const discKey = DISC_ALIASES[turmaData.disciplina] || turmaData.disciplina;
  const discValue = nav.DISCIPLINA[discKey];
  if (!discValue) throw new Error('Disciplina desconhecida: ' + turmaData.disciplina);
  const serieValue = nav.SERIE[turmaData.serie];
  const turmaLetra = turmaData.serie + turmaData.letra;

  const porMes = {};
  for (const ch of turmaData.chamadas) {
    const { canon, label, mes } = toCanonELabel(ch.data);
    (porMes[mes] = porMes[mes] || []).push({ canon, label, faltas: ch.faltas });
  }
  const meses = Object.keys(porMes);
  if (!meses.length) return [];

  const log = turmaData._log || (() => {});
  log('navegando pra ' + turmaLetra + ' ' + turmaData.disciplina + ' mes ' + meses[0]);
  await nav.navigateToFrequencia(c, serieValue, turmaLetra, discValue, meses[0]);
  log('navegou ok');

  const resultados = [];
  for (const mes of meses) {
    log('selecionando mes ' + mes);
    await nav.selecionarMes(c, mes);
    for (const { canon, label, faltas } of porMes[mes]) {
      const tdInfo = await cdp.evaluate(c, `(function(){ const td = document.querySelector('td[data-canonica="${canon}"]'); return td ? JSON.stringify({cls: td.className, lancamento: td.getAttribute('data-lancamento-frequencia')}) : null; })()`);
      const td = tdInfo ? JSON.parse(tdInfo) : null;
      if (td && td.lancamento === 'True') {
        log(label + ': calendario ja mostra lancamento=True — pulando sem abrir');
        resultados.push({ data: label, status: 'JA-SALVO-PULAR' });
        continue;
      }
      if (!td || !/dialog letivo/.test(td.cls)) {
        log(label + ': celula do calendario nao e dia letivo pra essa turma (cls=' + (td ? td.cls : 'null') + ') — SIAP nao reconhece esse dia, checar com a Malu');
        resultados.push({ data: label, status: 'NAO-LETIVO-NO-SIAP', cls: td ? td.cls : null });
        continue;
      }

      log('indo pra data ' + label);
      const ok = await nav.gotoDate(c, canon, label);
      if (!ok) { log('FALHOU-GOTODATE ' + label); resultados.push({ data: label, status: 'FALHOU-GOTODATE' }); continue; }
      await cdp.waitMs(400);

      const jaTemSelo = await cdp.evaluate(c, `document.querySelectorAll('.historicoConteudoFrequencia .containerHistorico').length`);
      if (jaTemSelo > 0) {
        log(label + ': ja tem selo de gravacao (' + jaTemSelo + ') — pulando sem mexer');
        resultados.push({ data: label, status: 'JA-SALVO-PULAR', selos: jaTemSelo });
        continue;
      }

      const atuais = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeFrequencias .item[data-ausente="True"]')).map(e => e.getAttribute('data-matricula')))`));
      const remover = atuais.filter(m => !faltas.includes(m));
      const adicionar = faltas.filter(m => !atuais.includes(m));
      log(label + ': atuais=' + atuais.length + ' remover=' + remover.length + ' adicionar=' + adicionar.length);

      if (remover.length === 0 && adicionar.length === 0) {
        log(label + ': JA-OK');
        resultados.push({ data: label, status: 'JA-OK', faltas: faltas.length });
        continue;
      }

      let cliqueOk = true;
      for (const mat of [...remover, ...adicionar]) {
        log(label + ': clicando matricula ' + mat);
        const r = await cdp.clickAndVerify(c, `.listaDeFrequencias .item[data-matricula="${mat}"]`, 'data-ausente', adicionar.includes(mat) ? 'True' : 'False', 6);
        log(label + ': matricula ' + mat + ' -> ' + (r ? 'OK' : 'FALHOU'));
        if (!r) cliqueOk = false;
      }

      const final = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeFrequencias .item[data-ausente="True"]')).map(e => e.getAttribute('data-matricula')))`)).sort();
      const bateu = JSON.stringify(final) === JSON.stringify([...faltas].sort());

      if (bateu && cliqueOk) {
        log(label + ': salvando');
        await cdp.realClick(c, '#cphFuncionalidade_btnAlterar');
        await cdp.waitMs(1800);
        log(label + ': CORRIGIDO');
        resultados.push({ data: label, status: 'CORRIGIDO', removidos: remover.length, adicionados: adicionar.length });
      } else {
        log(label + ': ERRO-DIFF esperado=' + JSON.stringify(faltas) + ' atual=' + JSON.stringify(final));
        resultados.push({ data: label, status: 'ERRO-DIFF', esperado: faltas, atual: final });
      }
    }
  }
  return resultados;
}

module.exports = { lancarFrequenciaTurma, toCanonELabel };
