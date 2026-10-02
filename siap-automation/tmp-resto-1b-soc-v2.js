const cdp = require('./cdp.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

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
  await cdp.evaluate(c, "location.href='https://siap.educacao.go.gov.br/DiarioEscolarListagem.aspx'");
  await cdp.waitMs(2500);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlSerie', '5711', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  c = await cdp.connect();
  await setSel(c, '#cphFuncionalidade_cphCampos_ddlDisciplina', '16', 2);
  await cdp.waitMs(1000);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2500);
  c = await cdp.connect();
  const idx = await cdp.evaluate(c, `(function(){ const rows=Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')); const re=/\\b1B\\b/; for(let i=1;i<rows.length;i++){ if(re.test(rows[i].innerText)) return i; } return -1; })()`);
  console.log('idx:', idx);
  await cdp.evaluate(c, 'document.querySelectorAll("#cphFuncionalidade_gdvListagem tr")[' + idx + '].click()');
  await cdp.waitMs(1500);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnAuxiliar3');
  await cdp.waitMs(3000);
  c = await cdp.connect();
  console.log('url final:', await cdp.evaluate(c, 'location.href'));

  const indice = await acharIndiceAvaliacao(c);
  console.log('indice:', indice);
  const alunos = [
    { nome: 'Isabella', mat: '26129977374', alvo: 6.8 },
    { nome: 'Lailla', mat: '26129971560', alvo: 10 },
    { nome: 'LuizFelipe', mat: '26130245330', alvo: 6.9 },
    { nome: 'AnaClara', mat: '26131647000', alvo: 9.1 },
    { nome: 'VictorOtavio', mat: '23125874535', alvo: 8.4 },
  ];
  for (const al of alunos) {
    const atual = await cdp.evaluate(c, `(function(){
      var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
      return el ? el.value : null;
    })()`);
    const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
    const r = await arredondarPara(c, indice, al.mat, al.alvo, 0, notaInicial, () => {});
    console.log(al.nome + ': alvo=' + al.alvo + ' -> parcial=' + r.parcialFinal);
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
