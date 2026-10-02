/* Acha o indiceAvaliacao de "Atividades Avaliativas" na pagina de Notas ja
   aberta, e ajusta a nota dessa atividade pro aluno ate a Media Parcial
   (e por consequencia a Media Bimestral, quando sem recuperacao) bater o
   alvo. A resposta do proprio POST ja devolve o Parcial recalculado. */
const cdp = require('./cdp.js');

async function acharIndiceAvaliacao(c) {
  return cdp.evaluate(c, `(function(){
    const titulos = Array.from(document.querySelectorAll('.titulo'));
    const hit = titulos.find(e => (e.innerText||'').trim() === 'Av. Subjetivas' || (e.innerText||'').trim()==='Av. Livres');
    if (!hit) return null;
    const conteudo = hit.closest('.itemConteudo').querySelector('.conteudo');
    const lst = Array.from(conteudo.querySelectorAll('.lista.listaDeNotas')).find(x => /atividades\\s+avaliativ/i.test(x.getAttribute('title')||''));
    return lst ? lst.getAttribute('data-id') : (conteudo.querySelector('.lista.listaDeNotas') ? conteudo.querySelector('.lista.listaDeNotas').getAttribute('data-id') : null);
  })()`);
}

async function setNotaAtividade(c, indice, mat, nota) {
  const resp = await cdp.evaluate(c, `(async function(){
    try {
      const r = await fetch('/DiarioDoProfessorWebMethods.aspx/WMAtualizaNotaSubjetiva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ indiceAvaliacao: ${JSON.stringify(indice)}, matricula: '${mat}', nota: ${nota} })
      });
      return JSON.stringify({ status: r.status, body: await r.text() });
    } catch (e) { return JSON.stringify({ erro: e.message }); }
  })()`);
  const parsed = JSON.parse(resp);
  if (parsed.erro) throw new Error(parsed.erro);
  const body = JSON.parse(parsed.body);
  const d = JSON.parse(body.d);
  return d.Parcial ? d.Parcial.Nota : null;
}

function parseVirgula(s) { return parseFloat(String(s).replace(',', '.')); }

/* alvo: media bimestral desejada (numero, ex: 6.0 ou 10). recAtual: valor
   numerico da recuperacao ja lancada (0 se nao tem). Resolve pra MP
   necessaria dado MB=(MP+Rec)/2 (ou MB=MP se recAtual=0/sem rec). */
async function arredondarPara(c, indice, mat, alvo, recAtual, notaAtividadeInicial, log) {
  log = log || (() => {});
  const mpNecessaria = recAtual > 0 ? (2 * alvo - recAtual) : alvo;
  let nota = notaAtividadeInicial;
  let parcial = await setNotaAtividade(c, indice, mat, nota);
  log(`tentativa nota=${nota} -> parcial=${parcial}`);
  let tentativas = 0;
  while (tentativas < 6 && Math.abs(parcial - mpNecessaria) > 0.05) {
    const diff = mpNecessaria - parcial;
    nota = Math.max(0, Math.min(10, nota + diff * 1.5));
    nota = Math.round(nota * 10) / 10;
    parcial = await setNotaAtividade(c, indice, mat, nota);
    log(`tentativa nota=${nota} -> parcial=${parcial}`);
    tentativas++;
  }
  return { notaFinal: nota, parcialFinal: parcial };
}

module.exports = { acharIndiceAvaliacao, setNotaAtividade, arredondarPara, parseVirgula };
