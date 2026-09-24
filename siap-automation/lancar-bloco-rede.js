/* Lança acertos de uma prova de "Bloco da Rede" (variante grade de
   checkboxes, ctl00=Pres.1a, ctl01=Aus.1a, ctl02=Pres.2a, ctl03=Aus.2a,
   ctl04..=questao 1,2,3...) numa turma-disciplina, a partir de um mapa
   NOME_OFICIAL_SIAP -> acertos. Marca presença + as N primeiras questões
   como corretas (só o total importa). Não mexe em quem não está no mapa
   (fica ausente, sem alterar). */
const cdp = require('./cdp.js');

async function esperarSelectPronto(c, sel, minOptions, maxTentativas) {
  minOptions = minOptions || 2;
  maxTentativas = maxTentativas || 15;
  for (let i = 0; i < maxTentativas; i++) {
    const n = await cdp.evaluate(c, `document.querySelector(${JSON.stringify(sel)})?.options.length || 0`);
    if (n >= minOptions) return true;
    await cdp.waitMs(700);
  }
  return false;
}

async function setSel(c, sel, value, minOptions) {
  const pronto = await esperarSelectPronto(c, sel, minOptions);
  if (!pronto) throw new Error('select ' + sel + ' nao populou a tempo');
  await cdp.evaluate(c, `(function(){ const el=document.querySelector(${JSON.stringify(sel)}); el.value=${JSON.stringify(value)}; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
}

async function abrirBloco(c, { composicao, serieValue, turno, turmaValue, disciplinaValue, bimestre, tituloContem }) {
  await cdp.evaluate(c, `location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'`);
  await esperarSelectPronto(c, '#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo', 3);
  await setSel(c, '#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo', '1', 3);
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlComposicao', composicao, 2);
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlSerie', serieValue, 2);
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlTurno', turno, 2);
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlTurma', turmaValue, 2);
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlDisciplina', disciplinaValue, 2);
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlBimestre', bimestre, 2);
  await cdp.waitMs(1500);
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2500);

  const idx = await cdp.evaluate(c, `(function(){
    const rows = Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr'));
    const re = new RegExp(${JSON.stringify(tituloContem)}, 'i');
    for (let i = 1; i < rows.length; i++) { if (re.test(rows[i].innerText)) return i; }
    return -1;
  })()`);
  if (idx < 0) throw new Error('linha "' + tituloContem + '" nao encontrada na listagem');
  await cdp.evaluate(c, `document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')[${idx}].click()`);
  await cdp.waitMs(1500);
  await cdp.click(c, '#cphFuncionalidade_btnEditar');
  await cdp.waitMs(2500);
}

async function lerLinhas(c) {
  const js = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    return JSON.stringify(rows.map(function(tr, i){ return { idx: i, nome: tr.innerText.trim().split('\\n')[0].replace(/^\\d+\\s*-\\s*/, '') }; }));
  })()`;
  return JSON.parse(await cdp.evaluate(c, js));
}

/* mapaAcertos: { 'NOME OFICIAL SIAP (maiusculo)': numeroDeAcertos } */
async function lancarAcertosGrade(c, mapaAcertos, log) {
  log = log || (() => {});
  const linhas = await lerLinhas(c);
  const resultados = [];
  for (const { idx, nome } of linhas) {
    const acertos = mapaAcertos[nome.toUpperCase()];
    if (acertos === undefined) { resultados.push({ nome, status: 'sem-dado-pulado' }); continue; }

    const presId = `#cphFuncionalidade_cphCampos_gdvLista_ctl00_${idx}`;
    await cdp.click(c, presId);
    await cdp.waitMs(120);

    for (let q = 1; q <= acertos; q++) {
      const nn = String(3 + q).padStart(2, '0'); // ctl04=Q1, ctl05=Q2, ...
      const sel = `#cphFuncionalidade_cphCampos_gdvLista_ctl${nn}_${idx}`;
      await cdp.click(c, sel);
      await cdp.waitMs(80);
    }
    log(nome + ': presenca + ' + acertos + ' acertos marcados (linha ' + idx + ')');
    resultados.push({ nome, status: 'marcado', acertos });
  }
  return resultados;
}

async function conferirQtdeAcertos(c) {
  const js = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    return JSON.stringify(rows.map(function(tr){
      const tds = Array.from(tr.querySelectorAll('td'));
      const nome = tr.innerText.trim().split('\\n')[0].replace(/^\\d+\\s*-\\s*/, '');
      const qtdeTd = tds.find(td => /qtdeAcertos|Qtde/i.test(td.className)) || tds[tds.length - 2];
      return { nome, qtdeTexto: qtdeTd ? qtdeTd.innerText.trim() : null };
    }));
  })()`;
  return JSON.parse(await cdp.evaluate(c, js));
}

async function salvar(c) {
  await cdp.realClick(c, '#cphFuncionalidade_btnAlterar');
  await cdp.waitMs(2000);
}

module.exports = { abrirBloco, lerLinhas, lancarAcertosGrade, conferirQtdeAcertos, salvar };
