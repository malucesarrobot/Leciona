const cdp = require('./cdp.js');
const { arredondarPara, parseVirgula } = require('./arredondar-media.js');

async function main() {
  const c = await cdp.connect();
  const indice = 25269271;
  const alunos = [
    { nome: 'Isabella', mat: '26129977374', alvo: 6.8 },
    { nome: 'Lailla', mat: '26129971560', alvo: 10 },
    { nome: 'LuizFelipe', mat: '26130245330', alvo: 6.9 },
    { nome: 'AnaClara', mat: '26131647000', alvo: 9.1 },
    { nome: 'VictorOtavio', mat: '23125874535', alvo: 8.4 },
  ];
  for (const al of alunos) {
    try {
      const atual = await cdp.evaluate(c, `(function(){
        var el = document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input');
        return el ? el.value : null;
      })()`);
      const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
      const r = await arredondarPara(c, indice, al.mat, al.alvo, 0, notaInicial, () => {});
      console.log(al.nome + ': alvo=' + al.alvo + ' -> parcial=' + r.parcialFinal);
    } catch (e) {
      console.log(al.nome + ': ERRO -> ' + e.message);
    }
  }
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
