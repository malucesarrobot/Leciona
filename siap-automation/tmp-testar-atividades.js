const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const mat = '25128336445';

  const indice = await cdp.evaluate(c, `(function(){
    const titulos = Array.from(document.querySelectorAll('.titulo'));
    const hit = titulos.find(e => (e.innerText||'').trim() === 'Av. Subjetivas');
    const conteudo = hit.closest('.itemConteudo').querySelector('.conteudo');
    const lst = Array.from(conteudo.querySelectorAll('.lista.listaDeNotas')).find(x => /atividades\\s+avaliativ/i.test(x.getAttribute('title')||''));
    return lst.getAttribute('data-id');
  })()`);
  console.log('indiceAvaliacao:', indice);

  // testa setar Atividades pra 5,0 e ve o que acontece com MP
  const resp = await cdp.evaluate(c, `(async function(){
    try {
      const r = await fetch('/DiarioDoProfessorWebMethods.aspx/WMAtualizaNotaSubjetiva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ indiceAvaliacao: ${JSON.stringify(indice)}, matricula: '${mat}', nota: 5.0 })
      });
      return JSON.stringify({ status: r.status, body: await r.text() });
    } catch (e) { return JSON.stringify({ erro: e.message }); }
  })()`);
  console.log('resposta fetch teste 5,0:', resp);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
