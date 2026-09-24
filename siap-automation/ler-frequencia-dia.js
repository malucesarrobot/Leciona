/* Leitura (read-only) da frequência já lançada no SIAP pra um conjunto de
   turma-disciplina+data, pra resolver pendências de nome ambíguo da
   importação da planilha do Arlan usando o SIAP como base correta. */
const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function toCanonELabel(dataISO) {
  const [y, m, d] = dataISO.split('-').map(Number);
  return { canon: `${y}/${m}/${d}`, label: `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`, mes: MESES[m-1] };
}

const DISC_ALIASES = { 'História': 'Historia', 'Estudo Orientado': 'EstudoOrientado' };

async function lerDia(c, { serie, letra, disciplina, dataISO }) {
  const discKey = DISC_ALIASES[disciplina] || disciplina;
  const discValue = nav.DISCIPLINA[discKey];
  const serieValue = nav.SERIE[serie];
  const turmaLetra = serie + letra;
  const { canon, label, mes } = toCanonELabel(dataISO);

  await nav.navigateToFrequencia(c, serieValue, turmaLetra, discValue, mes);
  await cdp.waitMs(400);
  const ok = await nav.gotoDate(c, canon, label);
  if (!ok) return { erro: 'FALHOU-GOTODATE', data: label };
  await cdp.waitMs(500);

  const alunos = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeFrequencias .item')).map(e => ({
    matricula: e.getAttribute('data-matricula'),
    nome: (e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,''),
    ausente: e.getAttribute('data-ausente')
  })))`));
  return { turma: turmaLetra, disciplina, data: label, alunos };
}

async function main() {
  const pedidos = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const c = await cdp.connect();
  const resultados = [];
  for (const p of pedidos) {
    console.log('lendo', JSON.stringify(p));
    try {
      const r = await lerDia(c, p);
      resultados.push(r);
      console.log(JSON.stringify(r));
    } catch (e) {
      console.log('ERRO:', e.message);
      resultados.push({ erro: e.message, pedido: p });
    }
  }
  await cdp.close(c);
  fs.writeFileSync('/tmp/leitura-frequencia-siap.json', JSON.stringify(resultados, null, 1));
  console.log('salvo em /tmp/leitura-frequencia-siap.json');
}
main().catch(e => { console.error('FALHOU GERAL:', e.message); process.exit(1); });
