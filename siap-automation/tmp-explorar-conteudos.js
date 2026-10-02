const cdp = require('./cdp.js');
const nav = require('./nav.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function main() {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
  await cdp.evaluate(c0, `location.href='https://siap.educacao.go.gov.br/DiarioEscolarListagem.aspx'`);
  await cdp.waitMs(2500);
  await cdp.evaluate(c0, `(function(){ const sel=document.querySelector('#cphFuncionalidade_cphCampos_ddlComposicao'); sel.value='571'; sel.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await cdp.waitMs(2000);
  await cdp.evaluate(c0, `(function(){ document.querySelector('#cphFuncionalidade_cphCampos_ddlSerie').value='5713'; document.querySelector('#cphFuncionalidade_cphCampos_ddlTurno').value='1'; document.querySelector('#cphFuncionalidade_cphCampos_ddlDisciplina').value='15'; })()`);
  await cdp.click(c0, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2000);
  const idx = await cdp.evaluate(c0, `(function(){ const rows=Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')); const re = new RegExp('\\\\b3A\\\\b'); for(let i=1;i<rows.length;i++){ if(re.test(rows[i].innerText)) return i; } return -1; })()`);
  await cdp.evaluate(c0, `document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')[${idx}].click()`);
  await cdp.waitMs(1500);
  await cdp.click(c0, '#cphFuncionalidade_btnAuxiliar1');
  await cdp.waitMs(2500);
  const c = await cdp.connect(AUTOMATION_TAB);
  const botoes = await cdp.evaluate(c, `(function(){
    var els = Array.from(document.querySelectorAll('a, button, input[type=submit], input[type=button]'));
    return JSON.stringify(els.map(function(e){ return { tag: e.tagName, id: e.id, text: (e.innerText||e.value||'').trim() }; }).filter(function(x){return x.text;}));
  })()`);
  console.log(botoes);
  console.log('URL:', await cdp.evaluate(c, 'location.href'));
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
