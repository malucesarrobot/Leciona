/* Teste de UMA aula do Planejamento 4º Bimestre — SOMENTE INVESTIGAÇÃO,
   não clica em Validar/Salvar no final. Roda contra 1A Filosofia, semana 1
   ("Pensar e Argumentar", EM13CHS103). Tira screenshots e dumps de cada
   etapa pra eu confirmar que a lógica em planejamento-4bim-lib.js bate com
   a tela real antes de aplicar em massa. */
const cdp = require('./cdp.js');
const nav = require('./nav.js');
const lib = require('./planejamento-4bim-lib.js');
const { PLANO_4BIM } = require('./planejamento-4bim-dados.js');

const AUTOMATION_TAB = lib.AUTOMATION_TAB;

async function shot(c, nome) {
  const r = await c.send('Page.captureScreenshot', { format: 'png' }, c.sessionId);
  require('fs').writeFileSync(`/tmp/teste-planej-${nome}.png`, Buffer.from(r.data, 'base64'));
  console.log('screenshot:', nome);
}

async function main() {
  let c = await cdp.connect(AUTOMATION_TAB);
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});

  console.log('1. Navegando pra listagem de Acompanhamento do Planejamento...');
  await lib.navegarListagemPlanejamento(c);
  c = await cdp.connect(AUTOMATION_TAB);
  await shot(c, '1-listagem');

  console.log('2. Procurando turma FILOSOFIA 1A e suas aulas nao-planejadas...');
  const info = await cdp.evaluate(c, `(function(){
    var blocos = Array.from(document.querySelectorAll('*')).filter(function(e){
      return e.children.length > 0 && /FILOSOFIA/.test(e.textContent) === false;
    });
    // acha todos os ".aula" da pagina com seu texto e classe, pra eu mapear manualmente
    var aulas = Array.from(document.querySelectorAll('.aula'));
    return JSON.stringify(aulas.map(function(a,i){ return { i: i, texto: a.textContent.trim(), cls: a.className }; }));
  })()`);
  console.log('AULAS NA PAGINA (indice, texto, classe):');
  console.log(info);

  // tenta achar o container da seção FILOSOFIA / 1A especificamente, pra pegar
  // o primeiro .aula DELA (nao de outra turma)
  const idxAlvo = await cdp.evaluate(c, `(function(){
    var all = Array.from(document.querySelectorAll('body *'));
    var secoes = [];
    var atual = null;
    // percorre nos de texto simples pra achar blocos "FILOSOFIA" seguidos de "1A"
    var textos = Array.from(document.querySelectorAll('div,td,span')).filter(function(e){ return e.children.length===0; });
    for (var i=0;i<textos.length-1;i++){
      if (/^FILOSOFIA$/i.test(textos[i].textContent.trim())) {
        // procura "1A" nos proximos 5 elementos
        for (var j=i+1;j<Math.min(i+6, textos.length);j++){
          if (/^1A$/.test(textos[j].textContent.trim())) {
            // achou - agora acha o primeiro .aula depois desse ponto no DOM
            var container = textos[i].closest('div');
            var aulaEl = container ? container.parentElement.querySelector('.aula.naoPlanejada') : null;
            if (aulaEl) {
              var todasAulas = Array.from(document.querySelectorAll('.aula'));
              return todasAulas.indexOf(aulaEl);
            }
          }
        }
      }
    }
    return -1;
  })()`);
  console.log('Indice da primeira aula naoPlanejada de FILOSOFIA 1A:', idxAlvo);

  if (idxAlvo < 0) {
    console.log('NAO ACHOU — preciso investigar a estrutura manualmente. Parando aqui.');
    return;
  }

  console.log('3. Clicando nessa aula...');
  await lib.clicarAulaPorIndice(c, idxAlvo);
  c = await cdp.connect(AUTOMATION_TAB);
  await shot(c, '2-tela-edicao-aberta');

  const dadosIniciais = await cdp.evaluate(c, `(function(){
    return JSON.stringify({
      serie: document.querySelector('#cphFuncionalidade_cphCampos_ddlSerie')?.value,
      turma: document.querySelector('[id*=txtTurma],[id*=lblTurma]')?.textContent,
      nAula: document.querySelector('[id*=NAula],[id*=NumAula],[id*=txtAula]')?.value || document.body.innerText.match(/N[º°]\\s*Aula[\\s\\S]{0,20}/)?.[0],
      disciplina: document.body.innerText.match(/Componente Curricular[\\s\\S]{0,60}/)?.[0]
    });
  })()`);
  console.log('DADOS DA TELA ABERTA:', dadosIniciais);

  console.log('4. Selecionando Bimestre=4 e habilidade EM13CHS103...');
  const semana1Filosofia1 = PLANO_4BIM.Filosofia['1'][0];
  console.log('Buscando codigo BNCC:', semana1Filosofia1.bncc);
  const r = await lib.selecionarHabilidadeBimestre(c, 4, semana1Filosofia1.bncc);
  console.log('Resultado selecionarHabilidadeBimestre:', JSON.stringify(r));
  c = await cdp.connect(AUTOMATION_TAB);
  await shot(c, '3-apos-selecionar-habilidade-bimestre');

  const textoGrids = await cdp.evaluate(c, `document.body.innerText.slice(0, 4000)`);
  console.log('TEXTO DA PAGINA APOS SELECIONAR (pra eu ver os grids de Habilidades/Objetivos que apareceram):');
  console.log(textoGrids);

  console.log('FIM DO TESTE (nao salvei nada).');
}
main().catch(e => console.error('ERRO GERAL:', e.message));
