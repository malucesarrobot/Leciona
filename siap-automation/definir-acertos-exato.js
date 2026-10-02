/* Define o estado EXATO de acertos de um bloco (não depende do estado
   anterior): marca presença + força cada questão pra checked/unchecked
   conforme o numero de acertos do mapa, usando setChecked (não .click,
   que so alterna) pra garantir resultado correto mesmo sobre um
   lançamento anterior errado. */
const cdp = require('./cdp.js');

async function lerLinhas(c) {
  const js = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    return JSON.stringify(rows.map(function(tr, i){ return { idx: i, nome: tr.innerText.trim().split('\\n')[0].replace(/^\\d+\\s*-\\s*/, '').trim() }; }));
  })()`;
  return JSON.parse(await cdp.evaluate(c, js));
}

async function definirAcertosExato(c, mapaAcertos, totalQuestoes, log) {
  log = log || (() => {});
  const linhas = await lerLinhas(c);
  const resultados = [];
  for (const { idx, nome } of linhas) {
    const acertos = mapaAcertos[nome.toUpperCase()];
    if (acertos === undefined) { resultados.push({ nome, status: 'sem-dado-pulado' }); continue; }

    const presId = `#cphFuncionalidade_cphCampos_gdvLista_ctl00_${idx}`;
    await cdp.setChecked(c, presId, true);

    for (let q = 1; q <= totalQuestoes; q++) {
      const nn = String(3 + q).padStart(2, '0');
      const sel = `#cphFuncionalidade_cphCampos_gdvLista_ctl${nn}_${idx}`;
      await cdp.setChecked(c, sel, q <= acertos);
    }
    log(nome + ': ' + acertos + '/' + totalQuestoes + ' (linha ' + idx + ')');
    resultados.push({ nome, status: 'marcado', acertos });
  }
  return resultados;
}

module.exports = { lerLinhas, definirAcertosExato };
