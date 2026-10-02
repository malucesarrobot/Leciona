const cdp = require('./cdp.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
async function main() {
  const c = await cdp.connect();
  const alunos = [
    { nome: 'JULIA', mat: '26130296080', valor: '9,0' },
    { nome: 'ALICIA', mat: '22120728163', valor: '9,0' },
    { nome: 'THIFANNY', mat: '26131223489', valor: '9,0' },
    { nome: 'LUCAS', mat: '26131715155', valor: '10,0' },
    { nome: 'JOAO_GABRIEL', mat: '26130873558', valor: '9,0' },
    { nome: 'SAMUEL', mat: '23125635192', valor: '9,0' },
    { nome: 'THAWANNY', mat: '26130252517', valor: '9,0' },
  ];
  for (const a of alunos) {
    const r = await preencherRecuperacao(c, a.mat, a.valor);
    console.log(a.nome, JSON.stringify(r));
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
