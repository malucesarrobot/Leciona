const cdp = require('./cdp.js');
const bloco = require('./lancar-bloco-rede.js');
const fs = require('fs');

const DISC = { filosofia: '15', historia: '4', sociologia: '16', geografia: '3' };
const CHAVE = { filosofia: 'f', historia: 'h', sociologia: 's', geografia: 'g' };

async function main() {
  const discNome = process.argv[2];
  const mapaRaw = JSON.parse(fs.readFileSync('/private/tmp/claude-502/-Users-MaluRibeiro1/05a7fcd7-9829-4c11-bb39-e5a9ad1d8832/scratchpad/bloco-2b-acertos.json', 'utf8'));
  const chave = CHAVE[discNome];
  const mapa = {};
  for (const [nome, v] of Object.entries(mapaRaw)) mapa[nome] = v[chave];

  const c = await cdp.connect();
  await bloco.abrirBloco(c, {
    composicao: '571', serieValue: '5712', turno: '1', turmaValue: '202618',
    disciplinaValue: DISC[discNome], bimestre: '3', tituloContem: 'BLOCO DA REDE',
  });

  // SÓ LEITURA: nenhum clique, só lê data-qtde/texto final da coluna Qtde.Acertos
  const js = `(function(){
    const rows = Array.from(document.querySelectorAll('table tr')).filter(tr => /^\\d+\\s*-/.test(tr.innerText.trim()));
    return JSON.stringify(rows.map(function(tr){
      const nome = tr.innerText.trim().split('\\n')[0].replace(/^\\d+\\s*-\\s*/, '').trim();
      const tds = Array.from(tr.querySelectorAll('td'));
      const qtde = tds[tds.length-2] ? tds[tds.length-2].innerText.trim() : null;
      return { nome, qtde };
    }));
  })()`;
  const leitura = JSON.parse(await cdp.evaluate(c, js));

  let divergencias = 0, conferidos = 0;
  for (const l of leitura) {
    const esperado = mapa[l.nome.toUpperCase()];
    if (esperado === undefined) continue;
    conferidos++;
    if (String(l.qtde) !== String(esperado)) { divergencias++; console.log('DIFF', l.nome, 'esperado=' + esperado, 'siap=' + l.qtde); }
  }
  console.log(discNome + ': conferidos=' + conferidos + ' divergencias=' + divergencias);
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
