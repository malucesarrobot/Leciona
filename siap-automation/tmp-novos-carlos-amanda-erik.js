const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
const { acharIndiceAvaliacao, arredondarPara, parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '24F1581D6701311385D917514C258F36';

async function lerMB(c, mat) {
  return cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
}

async function navegarComRetry(serieValue, turmaLetra, discValue) {
  for (let i = 0; i < 4; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, serieValue, turmaLetra, discValue);
      await cdp.waitMs(4000);
      return;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(1500);
      if (i === 3) throw e;
    }
  }
}

async function aplicar(serieValue, turmaLetra, discValue, discNome, alunos) {
  await navegarComRetry(serieValue, turmaLetra, discValue);
  let c = await cdp.connect(AUTOMATION_TAB);
  let indice = await acharIndiceAvaliacao(c);
  let t = 0;
  while (!indice && t < 5) { await cdp.waitMs(1200); c = await cdp.connect(AUTOMATION_TAB); indice = await acharIndiceAvaliacao(c); t++; }
  for (const al of alunos) {
    try {
      let mb = await lerMB(c, al.mat);
      let ti = 0;
      while (!mb && ti < 4) { await cdp.waitMs(1000); mb = await lerMB(c, al.mat); ti++; }
      if (!mb) { console.log(`${turmaLetra} ${discNome} ${al.nome}: ERRO -> MB não encontrado`); continue; }
      const mbNum = parseVirgula(mb);
      if (mbNum < 6) {
        const r = await preencherRecuperacao(c, al.mat, '9,0');
        console.log(`${turmaLetra} ${discNome} ${al.nome}: MBantes=${mb} (recuperacao) 9,0 -> ${JSON.stringify(r)}`);
      } else {
        const alvo = Math.min(10, Math.round((mbNum + 1) * 10) / 10);
        const atual = await cdp.evaluate(c, `document.querySelector('.item.subjetiva.nota[data-matricula="${al.mat}"] input')?.value`);
        const notaInicial = Math.min(10, parseVirgula(atual || '5') + 1);
        const r = await arredondarPara(c, indice, al.mat, alvo, 0, notaInicial, () => {});
        console.log(`${turmaLetra} ${discNome} ${al.nome}: MBantes=${mb} alvo=${alvo} -> parcial=${r.parcialFinal}`);
      }
    } catch (e) {
      console.log(`${turmaLetra} ${discNome} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  await aplicar(nav.SERIE['2'], '2A', nav.DISCIPLINA.Filosofia, 'Filosofia', [
    { nome: 'CarlosHenrique', mat: '25128281810' },
  ]);
  await aplicar(nav.SERIE['2'], '2A', nav.DISCIPLINA.Sociologia, 'Sociologia', [
    { nome: 'CarlosHenrique', mat: '25128281810' },
  ]);
  await aplicar(nav.SERIE['3'], '3B', nav.DISCIPLINA.Filosofia, 'Filosofia', [
    { nome: 'AmandaSilva', mat: '21120235033' },
  ]);
  await aplicar(nav.SERIE['3'], '3B', nav.DISCIPLINA.Sociologia, 'Sociologia', [
    { nome: 'AmandaSilva', mat: '21120235033' },
  ]);
  await aplicar(nav.SERIE['3'], '3C', nav.DISCIPLINA.Filosofia, 'Filosofia', [
    { nome: 'ErikRafael', mat: '16109637035' },
  ]);
  await aplicar(nav.SERIE['3'], '3C', nav.DISCIPLINA.Sociologia, 'Sociologia', [
    { nome: 'ErikRafael', mat: '16109637035' },
  ]);
  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
