const cdp = require('./cdp.js');
async function setNota(c, indice, mat, nota) {
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
  return JSON.parse(resp);
}

async function main() {
  const c = await cdp.connect();
  const mat = '25128336445';
  const indice = 25269612;
  for (const nota of [3.5]) {
    const r = await setNota(c, indice, mat, nota);
    console.log('nota', nota, '->', r.body);
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
