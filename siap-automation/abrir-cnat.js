/* Abre o Lancamento de Notas Modelo (bloco da rede) pra uma disciplina de
   Ciencias da Natureza. Reconecta o CDP entre cada select que dispara
   postback real (mesmo padrao de abrir-passo-a-passo.js) — sem isso o
   proximo passo falha com "Inspected target navigated or closed". */
const cdp = require('./cdp.js');

async function setSelReconectando(sel, value, minOptions) {
  minOptions = minOptions || 2;
  let c = await cdp.connect();
  const js = `(async function(){
    for (let i = 0; i < 25; i++) {
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
  const r = await cdp.evaluate(c, js);
  console.log(sel, '->', r);
  await cdp.waitMs(2200);
  return r;
}

async function main() {
  const discValue = process.argv[2]; // '10' Biologia, '13' Quimica, '14' Fisica

  let c = await cdp.connect();
  await cdp.evaluate(c, "location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'");
  await cdp.waitMs(3000);

  await setSelReconectando('#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo', '1', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlSerie', '5712', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlTurma', '202618', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlDisciplina', discValue, 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlBimestre', '3', 2);

  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2500);
  console.log(await cdp.evaluate(c, 'document.body.innerText.slice(0,2500)'));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
