const cdp = require('./cdp.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
async function main() {
  const c = await cdp.connect();
  const alunos = [
    { nome: 'YURI', mat: '25128528785', valor: '9,0' },
    { nome: 'SAMUEL', mat: '25128277856', valor: '9,0' },
    { nome: 'ANA_PAULA', mat: '21119051339', valor: '9,0' },
  ];
  for (const a of alunos) {
    const r = await preencherRecuperacao(c, a.mat, a.valor);
    console.log(a.nome, JSON.stringify(r));
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
