/* Automação do "Planejamento do Professor por Turma" (SIAP) pro 4º bimestre.
   PRECISA DE VERIFICAÇÃO AO VIVO antes do primeiro lote — ver tmp-testar-1-aula.js.
   Pontos ainda não confirmados (marcados VERIFICAR abaixo):
   - value exato do <option> "4º Bimestre" no #cphFuncionalidade_cphCampos_ddlBimestre
   - se os grids de Habilidades/Objetivos/Metodologias/Avaliações seguem o
     mesmo padrão label+botão "Executar" já visto em Conteúdo/Material de
     Apoio/Outros Conteúdos — assumido aqui, mas não testado nesta tela.
   - tempo de espera dos postbacks (ddlBimestre, ddlEixo) — usando 2500ms
     como ponto de partida, igual às outras telas do SIAP. */
const cdp = require('./cdp.js');
const nav = require('./nav.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

// Metodologia/Avaliação padrão fixo (conforme decisão da Malu: "padrão fixo
// simples"). Ajustar aqui se ela pedir outra combinação.
const METODOLOGIA_PADRAO = [/aula expositiva/i, /debates tem[aá]ticos/i];
const AVALIACAO_PADRAO = [/^atividades$/i];

async function navegarListagemPlanejamento(c) {
  await cdp.evaluate(c, `location.href='https://siap.educacao.go.gov.br/AcompanhamentoPlanejamentoProfessorListagem.aspx'`);
  await cdp.waitMs(2500);
}

/* Lê, pra uma turma-disciplina já visível na listagem, a lista ordenada de
   números de aula com status "naoPlanejada" (precisa já estar no período
   certo selecionado). Retorna [{numero, elIndex}]. */
async function lerAulasNaoPlanejadas(c, turmaLetra, discNomeUpper) {
  const json = await cdp.evaluate(c, `(function(){
    var blocos = Array.from(document.querySelectorAll('.disciplinaPlanejamento, .turmaDisciplina, .bloco'));
    // fallback genérico: acha o texto da disciplina+turma e pega os .aula logo depois
    var all = document.body.innerText;
    return null; // placeholder — ver tmp-explorar-listagem-detalhada.js
  })()`);
  return json;
}

/* Clica o número de uma aula específica na listagem (já filtrada/visível)
   pra abrir a tela de edição. idx = índice entre os .aula da página toda
   (0-based, na ordem em que aparecem). */
async function clicarAulaPorIndice(c, idx) {
  await cdp.evaluate(c, `(function(){
    var els = Array.from(document.querySelectorAll('.aula'));
    if (els[${idx}]) els[${idx}].click();
  })()`);
  await cdp.waitMs(2000);
}

/* Dentro da tela de edição já aberta: troca bimestre, seleciona a opção do
   ddlEixo cujo texto contém algum dos códigos BNCC passados. */
async function selecionarHabilidadeBimestre(c, bimestreNum, codigosBNCC) {
  await cdp.evaluate(c, `(function(){
    var sel = document.querySelector('#cphFuncionalidade_cphCampos_ddlBimestre');
    if (sel) { sel.value = ${JSON.stringify(String(bimestreNum))}; sel.dispatchEvent(new Event('change', {bubbles:true})); }
  })()`);
  await cdp.waitMs(2500);

  const achou = await cdp.evaluate(c, `(function(){
    var sel = document.querySelector('#ddlEixo');
    if (!sel) return null;
    var codigos = ${JSON.stringify(codigosBNCC)};
    for (var i=0;i<sel.options.length;i++){
      var txt = sel.options[i].textContent;
      for (var j=0;j<codigos.length;j++){
        if (txt.indexOf(codigos[j]) >= 0) return sel.options[i].value;
      }
    }
    return null;
  })()`);
  if (!achou) return { ok: false, motivo: 'nenhum codigo BNCC bateu nas opcoes do ddlEixo' };

  await cdp.evaluate(c, `(function(){
    var sel = document.querySelector('#ddlEixo');
    sel.value = ${JSON.stringify(achou)};
    sel.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await cdp.waitMs(2500);
  return { ok: true };
}

/* Clica o botão "Executar" (ou equivalente) cujo item/linha mais próxima
   bate com a regex de texto. Busca genérica, igual ao padrão usado em
   Outros Conteúdos. Retorna true/false. */
async function clicarItemPorTexto(c, regexSource, regexFlags) {
  const clicou = await cdp.evaluate(c, `(function(){
    var re = new RegExp(${JSON.stringify(regexSource)}, ${JSON.stringify(regexFlags || 'i')});
    var candidatos = Array.from(document.querySelectorAll('span,div,td,a,label')).filter(function(e){
      return e.children.length === 0 && re.test(e.textContent || '');
    });
    for (var i=0;i<candidatos.length;i++) {
      var el = candidatos[i];
      var row = el.closest('tr') || el.closest('li') || el.closest('div');
      var btn = row ? row.querySelector('input[type=button],button,a.btn,input[value*=Executar i]') : null;
      if (!btn) {
        // tenta no proprio pai imediato
        btn = el.parentElement ? el.parentElement.querySelector('input[type=button],button') : null;
      }
      if (btn) { btn.click(); return true; }
    }
    return false;
  })()`);
  return clicou;
}

async function aplicarMetodologiaEAvaliacaoPadrao(c) {
  const resultados = { metodologia: [], avaliacao: [] };
  for (const re of METODOLOGIA_PADRAO) {
    const ok = await clicarItemPorTexto(c, re.source, re.flags);
    resultados.metodologia.push({ padrao: re.source, ok });
    await cdp.waitMs(1200);
  }
  for (const re of AVALIACAO_PADRAO) {
    const ok = await clicarItemPorTexto(c, re.source, re.flags);
    resultados.avaliacao.push({ padrao: re.source, ok });
    await cdp.waitMs(1200);
  }
  return resultados;
}

async function salvar(c) {
  await cdp.click(c, '#cphFuncionalidade_btnAlterar');
  await cdp.waitMs(2500);
}

module.exports = {
  AUTOMATION_TAB,
  navegarListagemPlanejamento,
  clicarAulaPorIndice,
  selecionarHabilidadeBimestre,
  clicarItemPorTexto,
  aplicarMetodologiaEAvaliacaoPadrao,
  salvar,
  METODOLOGIA_PADRAO,
  AVALIACAO_PADRAO,
};
