const cdp = require('./cdp.js');
const { lerLinhas, lancarAcertosGrade, conferirQtdeAcertos, salvar } = require('./lancar-bloco-rede.js');

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

const mapaAcertos = {
  'ALISON RODRIGUES CARVALHO MARQUES': 10,
  'ANA CLARA DA SILVA GONÇALVES': 26,
  'ANA VITÓRIA ALVES VIEIRA DOS SANTOS': 31,
  'ARTHUR CORREIA DE ANDRADE': 11,
  'ARTHUR FILLIPE MARQUES ALVES': 22,
  'CARLOS ALEXANDRE DA SILVA FONTENELE': 25,
  'GUILHERME FERREIRA DUARTE': 30,
  'HIARLES RIBEIRO DA SILVA': 27,
  'JHEMILE VITÓRIA SOUSA GOMES': 31,
  'JULIA CARVALHO SAMPAIO': 40,
  'KAROLAINE SOARES DE OLIVEIRA': 26,
  'LUCAS DE OLIVEIRA NUNES': 33,
  'LUIS HENRIQUE LIMA BARBOSA': 33,
  'MARCELLA RODRIGUES DANTAS': 18,
  'MARCOS VINICIUS DO NASCIMENTO PAULINO BENEVIDES': 34,
  'MARIA DA GRAÇA VIEIRA GONÇALVES': 26,
  'MARIANA PEREIRA MARQUES': 31,
  'NATHAN JUNIOR SANTANA FRANÇA': 5,
  'PAULO HENRIQUE DA SILVA BRITO': 24,
  'PEDRO HENRIQUE VIEIRA ARAUJO': 35,
  'PEDRO OLIVEIRA NUNES': 36,
  'PIETRO CARVALHO FRANCA': 27,
  'SABRINA VITÓRIA GONÇALVES DE SOUZA': 28,
  'SAMIRA GERMANO SANTOS': 11,
  'STEFHANY LORRANY DOS SANTOS': 40,
  'VINÍCIUS LEONARDO CABRAL DE AQUINO': 29,
  'YAGO CIPRIANO FÉLIX': 15,
  'YASMIM DA SILVA SANTOS': 37,
  'YASMIN FORTUNATO DE OLIVEIRA': 7,
  'YASMIN SOARES UCHOA ALVES': 28,
};
// Sem cartao localizado ou sem dados: EMILLY BEATRIZ PERONICO DOS REIS, LUANA DE ARAÚJO DA COSTA,
// MIGUEL VINICIUS MARQUES DE FREITAS, DAVI DE PAIVA SANTOS, KAUANY GUILHERME BORGES DA SILVA -> ficam sem marcar (ausentes)

async function main() {
  const c0 = await cdp.connect(AUTOMATION_TAB);
  await c0.send('Page.bringToFront', {}, c0.sessionId).catch(() => {});

  // Setar Total de Questoes = 40 e regenerar grade
  await cdp.evaluate(c0, `(function(){
    var el = document.querySelector('#cphFuncionalidade_cphCampos_txtTotaldeQuestoes');
    el.value = '40';
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
    el.blur();
  })()`);
  await cdp.waitMs(2500);

  const c = await cdp.connect(AUTOMATION_TAB);
  const temQ40 = await cdp.evaluate(c, `!!document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl43_0')`);
  console.log('Grade regenerada com 40 questoes?', temQ40);
  if (!temQ40) { console.log('ABORTANDO: grade nao tem 40 colunas ainda.'); return; }

  const resultados = await lancarAcertosGrade(c, mapaAcertos, (m) => console.log(m));
  console.log('--- resumo ---');
  resultados.forEach(r => console.log(JSON.stringify(r)));

  await salvar(c);
  console.log('SALVO.');
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
