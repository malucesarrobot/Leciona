const cdp = require('./cdp.js');
const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

const DISCIPLINAS = {
  'LÍNGUA PORTUGUESA': '1',
  'MATEMÁTICA': '2',
  'GEOGRAFIA': '3',
  'HISTÓRIA': '4',
  'EDUCAÇÃO FÍSICA': '7',
  'ARTE': '8',
  'BIOLOGIA': '10',
  'QUÍMICA': '13',
  'FÍSICA': '14',
  'FILOSOFIA': '15',
  'SOCIOLOGIA': '16',
  'LÍNGUA INGLESA': '322',
};

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
    var total = rows.length;
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
    return JSON.stringify({ total: total, faltantes: faltantes });
  })()`);
  await cdp.click(c1, '#cphFuncionalidade_btnCancelar');
  await cdp.waitMs(1800);
  return JSON.parse(info);
}

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

async function abrirFiltroBase() {
  let c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await cdp.evaluate(c0, `location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'`);
  await cdp.waitMs(2500);
  c0 = await cdp.connect(AUTOMATION_TAB);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo', '1', 2);
  await cdp.waitMs(1500);
  c0 = await cdp.connect(AUTOMATION_TAB);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  await cdp.waitMs(1800);
  c0 = await cdp.connect(AUTOMATION_TAB);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlSerie', '5712', 2);
  await cdp.waitMs(1800);
  c0 = await cdp.connect(AUTOMATION_TAB);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  await cdp.waitMs(1800);
  c0 = await cdp.connect(AUTOMATION_TAB);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlTurma', '202618', 2);
  await cdp.waitMs(1800);
}

async function main() {
  await abrirFiltroBase();
  for (const [nomeDisc, valor] of Object.entries(DISCIPLINAS)) {
    console.log(`\n### ${nomeDisc} ###`);
    try {
      const deslogado = await cdp.evaluate(await cdp.connect(AUTOMATION_TAB), `document.title.includes('rea de Acesso') || !!document.querySelector('#txtUsuario')`);
      if (deslogado) { console.log('  DESLOGADO - parando aqui.'); break; }
      const linhas = await listarAvaliacoes(valor);
      if (linhas.length === 0) { console.log('  (nenhuma avaliacao cadastrada)'); continue; }
      for (let idx = 1; idx <= linhas.length; idx++) {
        const nomeAval = linhas[idx - 1].split('|').pop().trim();
        try {
          const r = await abrirLinhaEListarFaltantes(idx);
          console.log(`  ${nomeAval}: ${r.total - r.faltantes.length}/${r.total} com nota`);
          r.faltantes.forEach(f => console.log('    FALTA: ' + f));
        } catch (e) {
          console.log(`  ${nomeAval}: ERRO -> ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`  ERRO DISCIPLINA: ${e.message}`);
    }
  }
  console.log('\nFIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
