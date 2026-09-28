/* Igual a lancar-bloco-rede.js, mas marca as questões EXATAS que cada
   aluno acertou (lista de posições locais) em vez de "as N primeiras" —
   usado quando temos correção granular (questão por questão) real. */
const cdp = require('./cdp.js');
const bloco = require('./lancar-bloco-rede.js'); // reusa abrirBloco, lerLinhas, salvar

/* mapaExato: { 'NOME OFICIAL SIAP': [posicoesLocaisCorretas] }
   nq: numero de questoes dessa disciplina nesta tela (ja conhecido, evita
   ficar sondando o DOM questao por questao pra cada aluno). */
async function lancarExato(c, mapaExato, nq, log) {
  log = log || (() => {});
  const linhas = await bloco.lerLinhas(c);
  const resultados = [];
  for (const { idx, nome } of linhas) {
    const nomeLimpo = nome.trim();
    const corretas = mapaExato[nomeLimpo.toUpperCase()];
    if (corretas === undefined) { resultados.push({ nome: nomeLimpo, status: 'sem-dado-pulado' }); continue; }

    const presId = `#cphFuncionalidade_cphCampos_gdvLista_ctl00_${idx}`;
    await cdp.setChecked(c, presId, true);
    await cdp.waitMs(120);

    const corretasSet = new Set(corretas);
    // le o estado atual de todas as questoes numa unica chamada (rapido)
    const jsLer = `(function(){
      const out = [];
      for (let q=1;q<=${nq};q++){
        const nn = String(3+q).padStart(2,'0');
        const el = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl'+nn+'_${idx}');
        out.push(el ? (el.checked?1:0) : null);
      }
      return JSON.stringify(out);
    })()`;
    const atual = JSON.parse(await cdp.evaluate(c, jsLer));

    for (let q = 1; q <= nq; q++) {
      const nn = String(3 + q).padStart(2, '0');
      const sel = `#cphFuncionalidade_cphCampos_gdvLista_ctl${nn}_${idx}`;
      await cdp.setChecked(c, sel, corretasSet.has(q));
      await cdp.waitMs(80);
    }
    log(nomeLimpo + ': presenca + ' + corretas.length + ' acertos exatos marcados (linha ' + idx + ', ' + nq + ' questoes)');
    resultados.push({ nome: nomeLimpo, status: 'marcado', acertos: corretas.length, nq });
  }
  return resultados;
}

module.exports = { lancarExato };
