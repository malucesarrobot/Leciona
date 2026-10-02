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

async function abrirFiltroBase(c0) {
  await cdp.evaluate(c0, `location.href='https://siap.educacao.go.gov.br/LancamentoNotasModeloListagem.aspx'`);
  await cdp.waitMs(2500);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddl_tipoConfiguracaoModelo', '1', 2);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  await cdp.waitMs(1200);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlSerie', '5712', 2);
  await cdp.waitMs(1200);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  await cdp.waitMs(1200);
  await setSel(c0, '#cphFuncionalidade_cphCampos_ddlTurma', '202618', 2);
  await cdp.waitMs(1200);
}

async function main() {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  const url = await cdp.evaluate(c0, 'location.href');
  if (!url.includes('LancamentoNotasModeloListagem')) {
    console.log('Pagina atual nao e a listagem esperada, navegando do zero...');
    await abrirFiltroBase(c0);
  } else {
    console.log('Usando pagina ja aberta pela Malu.');
  }

  for (const [nome, valor] of Object.entries(DISCIPLINAS)) {
    try {
      const c = await cdp.connect(AUTOMATION_TAB);
      const atual = await cdp.evaluate(c, `document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina')?.value`);
      if (atual !== valor) {
        const setR = await setSel(c, '#cphFuncionalidade_cphCampos_ddlDisciplina', valor, 2);
        await cdp.waitMs(1800);
      }
      const c15 = await cdp.connect(AUTOMATION_TAB);
      const confirma = await cdp.evaluate(c15, `document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina')?.value`);
      console.log(`  (disciplina setada p/ ${confirma}, esperado ${valor})`);
      await cdp.click(c15, '#cphFuncionalidade_btnListar');
      await cdp.waitMs(2500);
      const c2 = await cdp.connect(AUTOMATION_TAB);
      const linhas = await cdp.evaluate(c2, `(function(){
        var rows = Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr'));
        var out = [];
        for (var i = 1; i < rows.length; i++) {
          out.push(rows[i].innerText.split(String.fromCharCode(10)).join(' | '));
        }
        return JSON.stringify(out);
      })()`);
      const arr = JSON.parse(linhas);
      console.log(`=== ${nome} ===`);
      if (arr.length === 0) console.log('  (nenhuma avaliacao cadastrada)');
      arr.forEach(l => console.log('  ' + l));
    } catch (e) {
      console.log(`=== ${nome} === ERRO: ${e.message}`);
    }
  }
  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
