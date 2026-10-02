const cdp = require('./cdp.js');
const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function setSel(c, sel, value, minOptions) {
  minOptions = minOptions || 2;
  const js = `(async function(){
    for (let i = 0; i < 20; i++) {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (el && el.options.length >= ${minOptions}) {
        el.value = ${JSON.stringify(value)};
        el.dispatchEvent(new Event('change', {bubbles:true}));
        return 'OK';
      }
      await new Promise(r => setTimeout(r, 500));
    }
    return 'TIMEOUT';
  })()`;
  return cdp.evaluate(c, js);
}

async function main() {
  let c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  let url = await cdp.evaluate(c0, 'location.href');
  console.log('URL atual:', url);
  if (!url.includes('LancamentoNotasModeloListagem')) {
    console.log('Navegando do zero...');
    await cdp.evaluate(c0, `location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'`);
    await cdp.waitMs(2500);
    c0 = await cdp.connect(AUTOMATION_TAB);
    await setSel(c0, '#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo', '1', 2);
    await cdp.waitMs(1200);
    c0 = await cdp.connect(AUTOMATION_TAB);
    await setSel(c0, '#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
    await cdp.waitMs(1500);
    c0 = await cdp.connect(AUTOMATION_TAB);
    await setSel(c0, '#cphFuncionalidade_cphCampos_ddlSerie', '5712', 2);
    await cdp.waitMs(1500);
    c0 = await cdp.connect(AUTOMATION_TAB);
    await setSel(c0, '#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
    await cdp.waitMs(1500);
    c0 = await cdp.connect(AUTOMATION_TAB);
    await setSel(c0, '#cphFuncionalidade_cphCampos_ddlTurma', '202618', 2);
    await cdp.waitMs(1500);
    c0 = await cdp.connect(AUTOMATION_TAB);
  }
  // Seta disciplina DIRETO no browser, numa unica chamada que espera o postback assentar
  const setResult = await cdp.evaluate(c0, `(async function(){
    const el = document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina');
    if (!el) return 'SEM-ELEMENTO';
    el.value = '7';
    el.dispatchEvent(new Event('change', {bubbles:true}));
    // espera o postback do UpdatePanel assentar: poll ate o elemento sumir e voltar, ou ate 8s
    await new Promise(r => setTimeout(r, 2500));
    return 'OK';
  })()`);
  console.log('Set result:', setResult);

  // reconecta e confirma, com retry
  let confirma = null;
  for (let i = 0; i < 6; i++) {
    const c1 = await cdp.connect(AUTOMATION_TAB);
    confirma = await cdp.evaluate(c1, `document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina')?.value`);
    if (confirma === '7') break;
    await cdp.waitMs(1000);
  }
  console.log('Disciplina apos set (com retry):', confirma);

  // clica Listar com retry tambem
  let linhas = '[]';
  for (let i = 0; i < 4; i++) {
    const c1 = await cdp.connect(AUTOMATION_TAB);
    await cdp.click(c1, '#cphFuncionalidade_btnListar');
    await cdp.waitMs(2200);
    const c2 = await cdp.connect(AUTOMATION_TAB);
    linhas = await cdp.evaluate(c2, `(function(){
      var rows = Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr'));
      var out = [];
      for (var i = 1; i < rows.length; i++) out.push(rows[i].innerText.split(String.fromCharCode(10)).join(' | '));
      return JSON.stringify(out);
    })()`);
    if (JSON.parse(linhas).length > 0) break;
  }
  console.log('Linhas:', linhas);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
