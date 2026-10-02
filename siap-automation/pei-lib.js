const cdp = require('./cdp.js');
const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function navegarListagemFiltrada(c, bimestre) {
  bimestre = bimestre || '3';
  await cdp.evaluate(c, `location.href='https://siap.educacao.go.gov.br/PlanoEducacionalIndividualizadoPEIProfessorListagem.aspx'`);
  await cdp.waitMs(2500);
  await cdp.evaluate(c, `(function(){
    var selComp = document.querySelector('#cphFuncionalidade_cphCampos_ddlComposicao');
    selComp.value = '571';
    selComp.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await cdp.waitMs(2000);
  await cdp.evaluate(c, `(function(){
    var selBim = document.querySelector('#cphFuncionalidade_cphCampos_ddlBimestre');
    selBim.value = ${JSON.stringify(String(bimestre))};
    selBim.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await cdp.waitMs(1500);
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2500);
}

async function abrirRegistro(c, nomeRegex, discRegex) {
  const resultado = await cdp.evaluate(c, `(function(){
    var rows = Array.from(document.querySelectorAll('table tr')).filter(function(r){
      return new RegExp(${JSON.stringify(nomeRegex)}, 'i').test(r.textContent) && new RegExp(${JSON.stringify(discRegex)}, 'i').test(r.textContent);
    });
    if (!rows.length) return 'NAO-ACHOU';
    rows[0].click();
    return 'OK';
  })()`);
  if (resultado !== 'OK') return false;
  await cdp.waitMs(1000);
  await cdp.click(c, '#cphFuncionalidade_btnEditar');
  await cdp.waitMs(3500);
  return true;
}

async function aguardarFormularioCarregado(c, tentativas) {
  tentativas = tentativas || 8;
  for (let i = 0; i < tentativas; i++) {
    const ok = await cdp.evaluate(c, `!!document.querySelector('#cphFuncionalidade_cphCampos_txtPotencialidadesExpectativas')`);
    if (ok) return true;
    await cdp.waitMs(1200);
  }
  return false;
}

async function lerPerfil(c) {
  const campos = ['txtPotencialidadesCognitivas','txtPotencialidadesHabilidades','txtNecessidadesCognitivas','txtNecessidadesHabilidades'];
  const out = {};
  for (const campo of campos) {
    out[campo] = await cdp.evaluate(c, `document.querySelector('#cphFuncionalidade_cphCampos_${campo}')?.value`);
  }
  return out;
}

async function preencherAreaAcademica(c, textos) {
  for (const [id, texto] of Object.entries(textos)) {
    await cdp.evaluate(c, `(function(){
      var el = document.querySelector('#cphFuncionalidade_cphCampos_${id}');
      el.value = ${JSON.stringify(texto)};
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    })()`);
  }
}

async function salvar(c) {
  await cdp.click(c, '#cphFuncionalidade_btnAlterar');
  await cdp.waitMs(2500);
}

module.exports = { AUTOMATION_TAB, navegarListagemFiltrada, abrirRegistro, lerPerfil, preencherAreaAcademica, salvar, aguardarFormularioCarregado };
