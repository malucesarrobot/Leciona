const cdp = require('./cdp.js');
const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function listarAvaliacoes(disciplinaValor) {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await cdp.evaluate(c0, `(function(){
    var el = document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina');
    el.value = '${disciplinaValor}';
    el.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await cdp.waitMs(2000);
  const cb = await cdp.connect(AUTOMATION_TAB);
  await cdp.evaluate(cb, `(function(){
    var el = document.querySelector('#cphFuncionalidade_cphCampos_ddlBimestre');
    el.value = '3';
    el.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await cdp.waitMs(2000);
  const c1 = await cdp.connect(AUTOMATION_TAB);
  await cdp.click(c1, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2800);
  const c2 = await cdp.connect(AUTOMATION_TAB);
  const linhas = await cdp.evaluate(c2, `(function(){
    var rows = Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr'));
    var out = [];
    for (var i = 1; i < rows.length; i++) out.push(rows[i].innerText.split(String.fromCharCode(10)).join(' | '));
    return JSON.stringify(out);
  })()`);
  return JSON.parse(linhas);
}

async function abrirLinhaEListarFaltantes(idx) {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await cdp.evaluate(c0, `document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')[${idx}].click()`);
  await cdp.waitMs(1200);
  await cdp.click(c0, '#cphFuncionalidade_btnEditar');
  await cdp.waitMs(2500);
  const c1 = await cdp.connect(AUTOMATION_TAB);
  const info = await cdp.evaluate(c1, `(function(){
    var rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    var faltantes = [];
    rows.forEach(function(tr){
      var txt = tr.innerText;
      var nome = txt.split(String.fromCharCode(10))[0].replace(/^\\d+\\s*-\\s*/, '').trim();
      if (/Sem cart/i.test(txt)) { faltantes.push(nome + ' (sem cartao)'); return; }
      var tds = Array.from(tr.querySelectorAll('td'));
      var qtdeTd = tds[tds.length - 2];
      var v = qtdeTd ? qtdeTd.innerText.trim() : '';
      if (!v || v === '0' || v === '') faltantes.push(nome);
    });
    return JSON.stringify(faltantes);
  })()`);
  await cdp.click(c1, '#cphFuncionalidade_btnCancelar');
  await cdp.waitMs(1800);
  return JSON.parse(info);
}

async function checarDisciplina(nomeDisc, valor) {
  console.log(`\n### ${nomeDisc} ###`);
  const linhas = await listarAvaliacoes(valor);
  for (let idx = 1; idx <= linhas.length; idx++) {
    const nomeAval = linhas[idx - 1].split('|').pop().trim();
    try {
      const faltantes = await abrirLinhaEListarFaltantes(idx);
      console.log(`  ${nomeAval}:`);
      if (faltantes.length === 0) console.log('    (nenhum faltando!)');
      faltantes.forEach(f => console.log('    - ' + f));
    } catch (e) {
      console.log(`  ${nomeAval}: ERRO -> ${e.message}`);
      try {
        const c0 = await cdp.connect(AUTOMATION_TAB);
        await cdp.evaluate(c0, `location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'`);
        await cdp.waitMs(2500);
      } catch (e2) {}
    }
  }
}

async function main() {
  await checarDisciplina('Lingua Portuguesa', '1');
  await checarDisciplina('Matematica', '2');
  await checarDisciplina('Geografia', '3');
  await checarDisciplina('Quimica', '13');
  await checarDisciplina('Sociologia', '16');
  console.log('\nFIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
