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

async function navegar(serieValue, turmaLetra, discValue) {
  let c = await cdp.connect();
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});
  await cdp.evaluate(c, "location.href='https://siap.educacao.go.gov.br/DiarioEscolarListagem.aspx'");
  await cdp.waitMs(2500);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlSerie', serieValue, 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlDisciplina', discValue, 2);
  await cdp.waitMs(1000);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2500);
  c = await cdp.connect();
  const alvo = turmaLetra;
  const idx = await cdp.evaluate(c, `(function(){ const rows=Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')); const re=new RegExp('\\\\b${alvo}\\\\b'); for(let i=1;i<rows.length;i++){ if(re.test(rows[i].innerText)) return i; } return -1; })()`);
  await cdp.evaluate(c, 'document.querySelectorAll("#cphFuncionalidade_gdvListagem tr")[' + idx + '].click()');
  await cdp.waitMs(1500);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnAuxiliar3');
  await cdp.waitMs(3000);
  c = await cdp.connect();
  console.log('url final:', await cdp.evaluate(c, 'location.href'));
  return c;
}

module.exports = { navegar, setSel };
