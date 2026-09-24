/* Continua o lançamento assumindo que a tela de edição do Bloco já está
   aberta (usado quando a navegação anterior já chegou lá mas o script
   caiu antes de marcar/salvar). */
const cdp = require('./cdp.js');
const bloco = require('./lancar-bloco-rede.js');
const fs = require('fs');

const CHAVE = { filosofia: 'f', historia: 'h', sociologia: 's', geografia: 'g' };

async function main() {
  const discNome = process.argv[2];
  const modo = process.argv[3] || 'conferir';
  const mapaRaw = JSON.parse(fs.readFileSync('/private/tmp/claude-502/-Users-MaluRibeiro1/05a7fcd7-9829-4c11-bb39-e5a9ad1d8832/scratchpad/bloco-2b-acertos.json', 'utf8'));
  const chave = CHAVE[discNome];
  const mapa = {};
  for (const [nome, v] of Object.entries(mapaRaw)) mapa[nome] = v[chave];

  const c = await cdp.connect();
  console.log('url atual:', await cdp.evaluate(c, 'location.href'));

  const resultados = await bloco.lancarAcertosGrade(c, mapa, (m) => console.log('  ' + m));
  console.log('marcados:', resultados.filter(r=>r.status==='marcado').length);

  await cdp.waitMs(500);
  const conferencia = await bloco.conferirQtdeAcertos(c);
  let divergencias = 0;
  for (const linha of conferencia) {
    const esperado = mapa[linha.nome.toUpperCase()];
    if (esperado === undefined) continue;
    const bateu = String(linha.qtdeTexto).trim() === String(esperado);
    if (!bateu) { divergencias++; console.log('DIFF ' + linha.nome + ' esperado=' + esperado + ' tela=' + linha.qtdeTexto); }
  }
  console.log('divergencias:', divergencias);

  if (modo === 'salvar' && divergencias === 0) {
    await bloco.salvar(c);
    console.log('SALVO.');
  } else {
    console.log('nao salvou (modo=' + modo + ', divergencias=' + divergencias + ')');
  }
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
