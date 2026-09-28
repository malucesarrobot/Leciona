/* Corrige a Alisson e a Yasmin Fortunato (linha por nome, nao index fixo)
   numa tela de bloco ja aberta, pra bater com o gabarito exato — usado
   depois de detectar erro nos dados originais dessas duas. */
const cdp = require('./cdp.js');
const bloco = require('./lancar-bloco-rede.js');
const fs = require('fs');

const NQ = { educacaofisica: 7, linguainglesa: 6, linguaportuguesa: 20, arte: 7 };

async function corrigirAluno(c, idx, alvoPos, nq) {
  const alvoSet = new Set(alvoPos);
  const presId = `#cphFuncionalidade_cphCampos_gdvLista_ctl00_${idx}`;
  await cdp.setChecked(c, presId, true);
  await cdp.waitMs(120);

  for (let q = 1; q <= nq; q++) {
    const nn = String(3 + q).padStart(2, '0');
    const sel = `#cphFuncionalidade_cphCampos_gdvLista_ctl${nn}_${idx}`;
    await cdp.setChecked(c, sel, alvoSet.has(q));
    await cdp.waitMs(80);
  }
}

async function main() {
  const discNome = process.argv[2];
  const modo = process.argv[3] || 'conferir';
  const dados = JSON.parse(fs.readFileSync('/private/tmp/claude-502/-Users-MaluRibeiro1/05a7fcd7-9829-4c11-bb39-e5a9ad1d8832/scratchpad/linguagens-2b-final-v2.json', 'utf8'));
  const nq = NQ[discNome];

  const c = await cdp.connect();
  const linhas = await bloco.lerLinhas(c);
  const alisson = linhas.find(l => /ALISON/i.test(l.nome));
  const yasminF = linhas.find(l => /YASMIN FORTUNATO/i.test(l.nome));
  console.log('Alisson idx:', alisson && alisson.idx, '| Yasmin Fortunato idx:', yasminF && yasminF.idx);

  await corrigirAluno(c, alisson.idx, dados['ALISON RODRIGUES CARVALHO MARQUES'][discNome], nq);
  await corrigirAluno(c, yasminF.idx, dados['YASMIN FORTUNATO DE OLIVEIRA'][discNome], nq);

  const conf = await bloco.conferirQtdeAcertos(c);
  const alissonQ = conf.find(l => /ALISON/i.test(l.nome));
  const yasminQ = conf.find(l => /YASMIN FORTUNATO/i.test(l.nome));
  console.log('Alisson Qtde agora:', alissonQ && alissonQ.qtdeTexto, '(esperado ' + dados['ALISON RODRIGUES CARVALHO MARQUES'][discNome].length + ')');
  console.log('Yasmin Fortunato Qtde agora:', yasminQ && yasminQ.qtdeTexto, '(esperado ' + dados['YASMIN FORTUNATO DE OLIVEIRA'][discNome].length + ')');

  const ok = String(alissonQ.qtdeTexto).trim() === String(dados['ALISON RODRIGUES CARVALHO MARQUES'][discNome].length) &&
             String(yasminQ.qtdeTexto).trim() === String(dados['YASMIN FORTUNATO DE OLIVEIRA'][discNome].length);

  if (modo === 'salvar' && ok) {
    await bloco.salvar(c);
    console.log('SALVO.');
  } else {
    console.log(ok ? 'conferido OK, nao salvou (modo=conferir)' : 'DIVERGENCIA, nao salvou');
  }
  await cdp.close(c);
}
main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
