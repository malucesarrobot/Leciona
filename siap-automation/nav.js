/* Helpers de navegação dentro do SIAP (Diário do Professor → turma → Conteúdos/Frequência). */
const cdp = require('./cdp.js');

/* Códigos usados nos <select> do filtro "Diário do Professor" — únicos fixos
   pra este vínculo (571 = Ensino Médio Concomitante Intercomplementar, EFG). */
const SERIE = { '1': '5711', '2': '5712', '3': '5713' }; // 1ª/2ª/3ª série
const DISCIPLINA = { Historia: '4', Sociologia: '16', Filosofia: '15', EstudoOrientado: '1841' };

/* Navega do zero (Listagem → seleciona turma → Conteúdos → Frequência → mês)
   até a aba de Frequência de uma turma+disciplina, com o mês já selecionado.
   serieValue: '5711'|'5712'|'5713' (ou use SERIE['1'|'2'|'3']).
   turmaLetra: '1A', '2B', '3C' etc — usado como regex \bXX\b pra achar a linha certa.
   discValue: código da disciplina (ou use DISCIPLINA.Historia etc). */
async function navigateToFrequencia(c, serieValue, turmaLetra, discValue, mes) {
  mes = mes || 'Agosto';
  await cdp.evaluate(c, `location.href='https://siap.educacao.go.gov.br/DiarioEscolarListagem.aspx'`);
  await cdp.waitMs(2500);
  await cdp.evaluate(c, `(function(){ const sel=document.querySelector('#cphFuncionalidade_cphCampos_ddlComposicao'); sel.value='571'; sel.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await cdp.waitMs(2000);
  await cdp.evaluate(c, `(function(){ document.querySelector('#cphFuncionalidade_cphCampos_ddlSerie').value=${JSON.stringify(serieValue)}; document.querySelector('#cphFuncionalidade_cphCampos_ddlTurno').value='1'; document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina').value=${JSON.stringify(discValue)}; })()`);
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2000);
  const idx = await cdp.evaluate(c, `(function(){ const rows=Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')); const re = new RegExp('\\\\b${turmaLetra}\\\\b'); for(let i=1;i<rows.length;i++){ if(re.test(rows[i].innerText)) return i; } return -1; })()`);
  if (idx < 0) throw new Error('Linha não encontrada na listagem pra turma ' + turmaLetra);
  await cdp.evaluate(c, `document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')[${idx}].click()`);
  await cdp.waitMs(1500);
  await cdp.click(c, '#cphFuncionalidade_btnAuxiliar1'); // botão "Conteúdos" da listagem
  await cdp.waitMs(2000);
  await cdp.click(c, '#cphFuncionalidade_cphCampos_BtnFrequencia'); // aba Frequência dentro da página
  await cdp.waitMs(2000);
  await selecionarMes(c, mes);
}

/* Troca o mês do calendário mensal (Conteúdos OU Frequência — mesmo <select> nas duas abas). */
async function selecionarMes(c, mes) {
  await cdp.evaluate(c, `(function(){ const sel=document.querySelector('#selectMesCalendarioMensal'); if(!sel) return 'NOSELECT'; for(const o of sel.options){ if(o.text.trim()===${JSON.stringify(mes)}){ sel.value=o.value; sel.dispatchEvent(new Event('change',{bubbles:true})); return 'OK'; } } return 'NAOACHOU'; })()`);
  await cdp.waitMs(1800);
}

/* Clica numa data do calendário mensal e CONFIRMA que a "Data Selecionada" (ou o
   container de frequência) bateu com o esperado antes de seguir — tenta de novo
   se não bateu. NUNCA marcar falta/conteúdo sem essa confirmação: o clique de
   calendário falha silenciosamente com alguma frequência sob uso intenso, e sem
   essa checagem o próximo passo acaba mexendo na data errada (já aconteceu).
   canon: '2026/9/15' (o formato do atributo data-canonica do <td>).
   label: '15/09/2026' (o formato do campo "Data Selecionada"). */
async function gotoDate(c, canon, label) {
  for (let i = 0; i < 5; i++) {
    await cdp.realClick(c, `td[data-canonica="${canon}"]`);
    await cdp.waitMs(1200);
    const cd = await cdp.evaluate(c, `document.querySelector('#cphFuncionalidade_cphCampos_txtDataSelecionada')?.value || document.querySelector('.listaDeFrequencias')?.getAttribute('data-data')`);
    if (cd === label) return true;
    await cdp.waitMs(500);
  }
  return false;
}

module.exports = { navigateToFrequencia, selecionarMes, gotoDate, SERIE, DISCIPLINA };
