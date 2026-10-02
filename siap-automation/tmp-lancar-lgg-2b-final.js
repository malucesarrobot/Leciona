const cdp = require('./cdp.js');
const { lerLinhas, conferirQtdeAcertos, salvar } = require('./lancar-bloco-rede.js');
const SALVAR_DIRETO = true;

const AUTOMATION_TAB = '4966A1D298684B743271C9FE08D31F37';

const mapaAcertos = {
  'ALISON RODRIGUES CARVALHO MARQUES': 4,
  'ANA CLARA DA SILVA GONÇALVES': 4,
  'ANA VITÓRIA ALVES VIEIRA DOS SANTOS': 5,
  'ARTHUR CORREIA DE ANDRADE': 3,
  'ARTHUR FILLIPE MARQUES ALVES': 4,
  'CARLOS ALEXANDRE DA SILVA FONTENELE': 4,
  'GUILHERME FERREIRA DUARTE': 6,
  'HIARLES RIBEIRO DA SILVA': 4,
  'JHEMILE VITÓRIA SOUSA GOMES': 6,
  'JULIA CARVALHO SAMPAIO': 7,
  'KAROLAINE SOARES DE OLIVEIRA': 5,
  'LUCAS DE OLIVEIRA NUNES': 7,
  'LUIS HENRIQUE LIMA BARBOSA': 7,
  'MARCELLA RODRIGUES DANTAS': 3,
  'MARCOS VINICIUS DO NASCIMENTO PAULINO BENEVIDES': 6,
  'MARIA DA GRAÇA VIEIRA GONÇALVES': 5,
  'MARIANA PEREIRA MARQUES': 7,
  'NATHAN JUNIOR SANTANA FRANÇA': 2,
  'PAULO HENRIQUE DA SILVA BRITO': 6,
  'PEDRO HENRIQUE VIEIRA ARAUJO': 5,
  'PEDRO OLIVEIRA NUNES': 7,
  'PIETRO CARVALHO FRANCA': 5,
  'SABRINA VITÓRIA GONÇALVES DE SOUZA': 5,
  'SAMIRA GERMANO SANTOS': 2,
  'STEFHANY LORRANY DOS SANTOS': 7,
  'VINÍCIUS LEONARDO CABRAL DE AQUINO': 3,
  'YAGO CIPRIANO FÉLIX': 3,
  'YASMIM DA SILVA SANTOS': 7,
  'YASMIN FORTUNATO DE OLIVEIRA': 0,
  'YASMIN SOARES UCHOA ALVES': 4,
};

async function main() {
  const c = await cdp.connect(AUTOMATION_TAB);
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});
  const linhas = await lerLinhas(c);
  for (const { idx, nome } of linhas) {
    const nomeTrim = nome.trim().toUpperCase();
    const acertos = mapaAcertos[nomeTrim];
    if (acertos === undefined) { console.log(nomeTrim, '-> sem dado, pulado (ausente)'); continue; }
    // seta presenca=true e as questoes 1..acertos=true, resto=false, direto via JS (sem toggle)
    const r = await cdp.evaluate(c, `(function(){
      var pres = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl00_${idx}');
      if (pres) { pres.checked = true; pres.dispatchEvent(new Event('click', {bubbles:true})); pres.dispatchEvent(new Event('change', {bubbles:true})); }
      for (var q = 1; q <= 7; q++) {
        var nn = String(3 + q).padStart(2, '0');
        var el = document.querySelector('#cphFuncionalidade_cphCampos_gdvLista_ctl' + nn + '_${idx}');
        if (el) {
          var desejado = (q <= ${acertos});
          if (el.checked !== desejado) {
            el.checked = desejado;
            el.dispatchEvent(new Event('click', {bubbles:true}));
            el.dispatchEvent(new Event('change', {bubbles:true}));
          }
        }
      }
      return 'OK';
    })()`);
    console.log(nomeTrim, '-> presenca + ' + acertos + ' acertos setados (' + r + ')');
    await cdp.waitMs(60);
  }
  await cdp.waitMs(500);
  const conferido = await conferirQtdeAcertos(c);
  console.log('--- conferencia Qtde Acertos na tela ---');
  conferido.forEach(r => console.log(r.nome.trim(), '->', r.qtdeTexto));
  if (SALVAR_DIRETO) {
    await salvar(c);
    console.log('SALVO.');
  } else {
    console.log('NAO SALVEI AINDA - conferir numeros acima antes.');
  }
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
