/* Abre o bloco passo a passo, reconectando o CDP entre cada etapa que
   causa postback/navegacao real (evita "Inspected target navigated or
   closed" que acontece quando o mesmo websocket tenta continuar depois
   de uma navegacao completa de pagina). */
const cdp = require('./cdp.js');

async function passo(nome, fn) {
  console.log('--- ' + nome + ' ---');
  try {
    const r = await fn();
    console.log('OK', r !== undefined ? JSON.stringify(r) : '');
    return r;
  } catch (e) {
    console.log('FALHOU:', e.message);
    throw e;
  }
}

async function main() {
  const discNome = process.argv[2];
  const DISC = { educacaofisica: '7', linguainglesa: '322', linguaportuguesa: '1', arte: '8' };
  const discValue = DISC[discNome];

  let c = await cdp.connect();
  await passo('navegar pra listagem', async () => {
    await cdp.evaluate(c, `location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'`);
  });
  await cdp.waitMs(3000);

  // reconecta pra garantir sessao fresca depois da navegacao completa
  c = await cdp.connect();
  await passo('setar tipoConfiguracaoModelo', async () => {
    await cdp.evaluate(c, `(function(){ const el=document.querySelector('#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo'); el.value='1'; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  });
  await cdp.waitMs(2500);

  await passo('setar composicao', async () => {
    await cdp.evaluate(c, `(function(){ const el=document.querySelector('#cphFuncionalidade_cphCampos_ddlComposicao'); el.value='571'; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  });
  await cdp.waitMs(2500);

  await passo('setar serie', async () => {
    await cdp.evaluate(c, `(function(){ const el=document.querySelector('#cphFuncionalidade_cphCampos_ddlSerie'); el.value='5712'; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  });
  await cdp.waitMs(2500);

  await passo('setar turno', async () => {
    await cdp.evaluate(c, `(function(){ const el=document.querySelector('#cphFuncionalidade_cphCampos_ddlTurno'); el.value='1'; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  });
  await cdp.waitMs(3000);

  await passo('setar turma', async () => {
    await cdp.evaluate(c, `(function(){ const el=document.querySelector('#cphFuncionalidade_cphCampos_ddlTurma'); el.value='202618'; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  });
  await cdp.waitMs(2500);

  await passo('setar disciplina', async () => {
    await cdp.evaluate(c, `(function(){ const el=document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina'); el.value='${discValue}'; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  });
  await cdp.waitMs(2500);

  await passo('setar bimestre', async () => {
    await cdp.evaluate(c, `(function(){ const el=document.querySelector('#cphFuncionalidade_cphCampos_ddlBimestre'); el.value='3'; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  });
  await cdp.waitMs(1500);

  await passo('clicar Listar', async () => {
    await cdp.click(c, '#cphFuncionalidade_btnListar');
  });
  await cdp.waitMs(2500);

  const idx = await passo('achar linha BLOCO DA REDE', async () => {
    return await cdp.evaluate(c, `(function(){ const rows=Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')); for(let i=1;i<rows.length;i++){ if(/BLOCO DA REDE/i.test(rows[i].innerText)) return i; } return -1; })()`);
  });
  if (idx < 0) throw new Error('linha nao encontrada');

  await passo('clicar na linha', async () => {
    await cdp.evaluate(c, `document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')[${idx}].click()`);
  });
  await cdp.waitMs(1500);

  // reconecta antes do clique que causa postback pesado (abre edicao)
  c = await cdp.connect();
  await passo('clicar Visualizar (btnEditar)', async () => {
    await cdp.click(c, '#cphFuncionalidade_btnEditar');
  });
  await cdp.waitMs(3000);

  c = await cdp.connect();
  const urlFinal = await passo('confirmar url final', async () => {
    return await cdp.evaluate(c, 'location.href');
  });
  console.log('=== SUCESSO, url final:', urlFinal, '===');
}
main().catch(e => { console.error('FALHOU GERAL:', e.message); process.exit(1); });
