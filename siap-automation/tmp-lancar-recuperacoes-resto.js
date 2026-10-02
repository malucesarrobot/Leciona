const cdp = require('./cdp.js');
const nav = require('./nav.js');
const { preencherRecuperacao } = require('./preencher-recuperacao.js');

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

async function processarTurma(serieChar, turmaLetra, discNome, discValue, alunos) {
  await navegarComRetry(serieChar, turmaLetra, discValue);
  const c = await cdp.connect(AUTOMATION_TAB);
  for (const al of alunos) {
    try {
      const valorTexto = al.valor.toFixed(1).replace('.', ',');
      const r = await preencherRecuperacao(c, al.mat, valorTexto);
      console.log(`${turmaLetra} ${discNome} ${al.nome}: recuperacao ${valorTexto} -> ${JSON.stringify(r)}`);
      await cdp.waitMs(400);
    } catch (e) {
      console.log(`${turmaLetra} ${discNome} ${al.nome}: ERRO -> ${e.message}`);
    }
  }
}

async function main() {
  // RETRY: 3B Filosofia que falhou por timing
  await processarTurma('3', '3B', 'Filosofia', nav.DISCIPLINA.Filosofia, [
    { nome: 'Samuel', mat: '20117319501', valor: 2.5 },
    { nome: 'CarlosEduardoFerreira', mat: '20118603147', valor: 3.5 },
  ]);
  await processarTurma('3', '3A', 'Filosofia', nav.DISCIPLINA.Filosofia, [
    { nome: 'CarlosEduardoAraujo', mat: '24127171793', valor: 2.3 },
  ]);

  // HISTORIA
  await processarTurma('3', '3A', 'Historia', nav.DISCIPLINA.Historia, [
    { nome: 'GustavoRhuan', mat: '22122326127', valor: 4.2 },
    { nome: 'CarlosEduardoAraujo', mat: '24127171793', valor: 4.1 },
  ]);
  await processarTurma('2', '2B', 'Historia', nav.DISCIPLINA.Historia, [
    { nome: 'MiguelVinicius', mat: '23124035983', valor: 3.2 },
    { nome: 'JuliaCarvalho', mat: '25128472013', valor: 4.5 },
  ]);
  await processarTurma('3', '3B', 'Historia', nav.DISCIPLINA.Historia, [
    { nome: 'Samuel', mat: '20117319501', valor: 2.8 },
  ]);

  // SOCIOLOGIA
  await processarTurma('3', '3A', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'JulianaPortela', mat: '22122385239', valor: 3.3 },
    { nome: 'CeciliaLopesCosta', mat: '24127146060', valor: 2.0 },
    { nome: 'CarlosEduardoAraujo', mat: '24127171793', valor: 2.4 },
  ]);
  await processarTurma('2', '2B', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'Stefhany', mat: '25128142697', valor: 5.0 },
    { nome: 'JuliaCarvalho', mat: '25128472013', valor: 4.0 },
    { nome: 'Nathan', mat: '21119397333', valor: 1.9 },
  ]);
  await processarTurma('1', '1A', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'Calebe', mat: '23123936631', valor: 5.4 },
    { nome: 'AnaPaullyna', mat: '26130076425', valor: 5.0 },
    { nome: 'LucasSilvaOliveira', mat: '23127125540', valor: 5.8 },
  ]);
  await processarTurma('2', '2A', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'MariaClara', mat: '21119625347', valor: 5.0 },
  ]);
  await processarTurma('1', '1B', 'Sociologia', nav.DISCIPLINA.Sociologia, [
    { nome: 'KellyMagano', mat: '26131609191', valor: 4.1 },
  ]);

  console.log('FIM');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
