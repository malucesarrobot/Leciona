const cdp = require('./cdp.js');

async function setSel(c, sel, value, minOptions) {
  minOptions = minOptions || 2;
  const js = `(async function(){
    for (let i = 0; i < 20; i++) {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (el && el.options.length >= ${minOptions}) {
        el.value = ${JSON.stringify(value)};
        el.dispatchEvent(new Event('change', {bubbles:true}));
        return 'OK-' + el.value;
      }
      await new Promise(r => setTimeout(r, 700));
    }
    return 'TIMEOUT';
  })()`;
  return cdp.evaluate(c, js);
}

async function main() {
  let c = await cdp.connect();
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});
  await cdp.evaluate(c, "location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'");
  await cdp.waitMs(2500);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo', '1', 3);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlSerie', '5712', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlTurma', '202618', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlDisciplina', '14', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlBimestre', '3', 2);
  await cdp.waitMs(1000);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2500);
  c = await cdp.connect();
  const linhas = await cdp.evaluate(c, `(function(){
    const rows = Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr'));
    return JSON.stringify(rows.map(r => r.innerText.replace(/\\n/g,' | ')));
  })()`);
  console.log(linhas);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
