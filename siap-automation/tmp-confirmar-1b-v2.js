const cdp = require('./cdp.js');

async function setSelReconectando(sel, value, minOptions) {
  minOptions = minOptions || 2;
  let c = await cdp.connect();
  const js = `(async function(){
    for (let i = 0; i < 20; i++) {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (el && el.options.length >= ${minOptions}) {
        el.value = ${JSON.stringify(value)};
        el.dispatchEvent(new Event('change', {bubbles:true}));
        return 'OK-' + el.value;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    return 'TIMEOUT';
  })()`;
  const r = await cdp.evaluate(c, js);
  await cdp.waitMs(1500);
  return r;
}

async function main() {
  let c = await cdp.connect();
  await cdp.evaluate(c, "location.href='https://siap.educacao.go.gov.br/DiarioEscolarListagem.aspx'");
  await cdp.waitMs(2500);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlSerie', '5711', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlDisciplina', '4', 2);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2000);
  const idx = await cdp.evaluate(c, `(function(){ const rows=Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')); const re=/\\b1B\\b/; for(let i=1;i<rows.length;i++){ if(re.test(rows[i].innerText)) return i; } return -1; })()`);
  await cdp.evaluate(c, 'document.querySelectorAll("#cphFuncionalidade_gdvListagem tr")[' + idx + '].click()');
  await cdp.waitMs(1500);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnAuxiliar3');
  await cdp.waitMs(3000);
  c = await cdp.connect();
  console.log('url:', await cdp.evaluate(c, 'location.href'));

  const alunos = {
    JULIA: '26130296080', ALICIA: '22120728163', THIFANNY: '26131223489',
    LUCAS: '26131715155', JOAO_GABRIEL: '26130873558', SAMUEL: '23125635192', THAWANNY: '26130252517',
  };
  const resultado = {};
  for (const [nome, mat] of Object.entries(alunos)) {
    const rec = await cdp.evaluate(c, `(function(){
      var el = document.querySelector('.item.recuperacao.nota[data-matricula="${mat}"]');
      return el ? el.getAttribute('data-nota') : 'NAO-ACHOU';
    })()`);
    const mb = await cdp.evaluate(c, `(function(){
      var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
      var item = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
      return item ? item.textContent.trim() : 'NAO-ACHOU';
    })()`);
    console.log(nome, '| Rec:', rec, '| MB:', mb);
    resultado[mat] = { mb };
  }
  require('fs').writeFileSync('/tmp/mb_1b_check.json', JSON.stringify(resultado));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
