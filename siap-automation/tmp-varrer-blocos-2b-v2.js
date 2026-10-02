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

async function main() {
  for (const [nome, valor] of Object.entries(DISCIPLINAS)) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await cdp.evaluate(c0, `(function(){
        var el = document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina');
        el.value = '${valor}';
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
