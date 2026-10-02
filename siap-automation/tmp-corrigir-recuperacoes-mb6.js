const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');
const { parseVirgula } = require('./arredondar-media.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

async function navegarComRetry(serieChar, turmaLetra, discValue) {
  for (let i = 0; i < 5; i++) {
    try {
      const c0 = await cdp.connect(AUTOMATION_TAB);
      await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});
      await nav.navigateToNotas(c0, nav.SERIE[serieChar], turmaLetra, discValue);
      await cdp.waitMs(4500);
      return;
    } catch (e) {
      console.log(`  (retry ${i + 1}: ${e.message})`);
      await cdp.waitMs(2000);
      if (i === 4) throw e;
    }
  }
}

async function lerMP(c, mat) {
  return cdp.evaluate(c, `(function(){
    var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Parcial';});
    var it = lst ? lst.querySelector('.item[data-matricula="${mat}"]') : null;
    return it ? it.textContent.trim() : null;
  })()`);
}

async function processarTurma(serieChar, turmaLetra, discNome, discValue, alunos) {
  await navegarComRetry(serieChar, turmaLetra, discValue);
  let c = await cdp.connect(AUTOMATION_TAB);
  for (const al of alunos) {
    try {
      let mp = await lerMP(c, al.mat);
      let t = 0;
      while (!mp && t < 4) { await cdp.waitMs(1000); c = await cdp.connect(AUTOMATION_TAB); mp = await lerMP(c, al.mat); t++; }
      if (!mp) { console.log(`${turmaLetra} ${discNome} ${al.nome}: ERRO -> MP nao encontrada`); continue; }
      const mpNum = parseVirgula(mp);
      const rec = Math.max(0, Math.min(10, Math.round((12 - mpNum) * 10) / 10));
      const valorTexto = rec.toFixed(1).replace('.', ',');
      const r = await preencherRecuperacao(c, al.mat, valorTexto);
      console.log(`${turmaLetra} ${discNome} ${al.nome}: MP=${mp} -> recuperacao ${valorTexto} -> ${JSON.stringify(r)}`);
      await cdp.waitMs(400);
    } catch (e) {
      console.log(`${turmaLetra} ${discNome} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  // FILOSOFIA (corrigir os 7 ja lancados errados)
  await processarTurma('1', '1B', 'Filosofia', nav.DISCIPLINA.Filosofia, [
    { nome: 'Gilmar', mat: '26130806459' },
  ]);
  await processarTurma('2', '2B', 'Filosofia', nav.DISCIPLINA.Filosofia, [
    { nome: 'MiguelVinicius', mat: '23124035983' },
    { nome: 'Guilherme', mat: '25129114165' },
    { nome: 'Nathan', mat: '21119397333' },
  ]);
  await processarTurma('1', '1A', 'Filosofia', nav.DISCIPLINA.Filosofia, [
    { nome: 'Calebe', mat: '23123936631' },
  ]);
  await processarTurma('3', '3B', 'Filosofia', nav.DISCIPLINA.Filosofia, [
    { nome: 'Samuel', mat: '20117319501' },
    { nome: 'CarlosEduardoFerreira', mat: '20118603147' },
  ]);
  await processarTurma('3', '3A', 'Filosofia', nav.DISCIPLINA.Filosofia, [
    { nome: 'CarlosEduardoAraujo', mat: '24127171793' },
  ]);

  // HISTORIA
  await processarTurma('3', '3A', 'Historia', nav.DISCIPLINA.Historia, [
    { nome: 'GustavoRhuan', mat: '22122326127' },
    { nome: 'CarlosEduardoAraujo', mat: '24127171793' },
  ]);
  await processarTurma('2', '2B', 'Historia', nav.DISCIPLINA.Historia, [
    { nome: 'MiguelVinicius', mat: '23124035983' },
    { nome: 'JuliaCarvalho', mat: '25128472013' },
  ]);
  await processarTurma('3', '3B', 'Historia', nav.DISCIPLINA.Historia, [
    { nome: 'Samuel', mat: '20117319501' },
  ]);
  await processarTurma('2', '2A', 'Historia', nav.DISCIPLINA.Historia, [
    { nome: 'CarlosHenrique', mat: '25128281810' },
  ]);

  // SOCIOLOGIA
  await processarTurma('3', '3A', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'JulianaPortela', mat: '22122385239' },
    { nome: 'CeciliaLopesCosta', mat: '24127146060' },
    { nome: 'CarlosEduardoAraujo', mat: '24127171793' },
  ]);
  await processarTurma('2', '2B', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'Stefhany', mat: '25128142697' },
    { nome: 'JuliaCarvalho', mat: '25128472013' },
    { nome: 'Nathan', mat: '21119397333' },
  ]);
  await processarTurma('1', '1A', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'Calebe', mat: '23123936631' },
    { nome: 'AnaPaullyna', mat: '26130076425' },
    { nome: 'LucasSilvaOliveira', mat: '23127125540' },
  ]);
  await processarTurma('2', '2A', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'MariaClara', mat: '21119625347' },
  ]);
  await processarTurma('1', '1B', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'KellyMagano', mat: '26131609191' },
  ]);

  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
