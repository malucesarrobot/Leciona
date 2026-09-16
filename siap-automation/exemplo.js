/* Exemplo/modelo de uso — copie e adapte pra cada turma+disciplina+data que precisar
   lançar. Não é um script genérico de "rodar direto": cada execução tem que escolher
   o conteúdo certo (ver README.md, seção "Conteúdo") e os alunos certos (matrícula,
   não nome — ver README.md, seção "Frequência"). */
const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function main() {
  const c = await cdp.connect();

  // 1) Navega até a turma+disciplina, mês desejado.
  await nav.navigateToFrequencia(c, nav.SERIE['1'], '1B', nav.DISCIPLINA.Sociologia, 'Agosto');

  // 2) Pra mexer em Conteúdo, volta pra aba Conteúdos (a navigateToFrequencia já deixa em Frequência).
  await cdp.click(c, '#cphFuncionalidade_cphCampos_BtnConteudo');
  await cdp.waitMs(1800);
  await nav.selecionarMes(c, 'Agosto');

  // 3) Vai pra data e confirma antes de mexer em qualquer coisa.
  const ok = await nav.gotoDate(c, '2026/8/6', '06/08/2026');
  if (!ok) throw new Error('Não confirmou a data — pare e investigue antes de continuar');

  // 4) Marca o conteúdo sugerido (1º item da lista "Conteúdo Planejado" pra essa data).
  //    Se o sugerido não bater com o que foi dado de verdade, use "Outros Conteúdos"
  //    (botão #cphFuncionalidade_cphCampos_BtnContrOutrosConteudos) pra abrir o catálogo
  //    completo e clicar no "Executar" do item certo em vez deste.
  await cdp.click(c, '#cphFuncionalidade_cphCampos_grdPlanejado_Button1_0');
  await cdp.waitMs(900);

  // 5) Material de apoio — índice 6 = "Outros" (índice 7 = "Nenhum material de apoio utilizado").
  //    Ordem fixa na tabela: 0 Revisa Goiás, 1 Ser Goiás/Desafio Crescer, 2 Goiás TEC,
  //    3 Goiás English, 4 Conectando Palavras/Letrus, 5 Redação Nota 1000, 6 Outros, 7 Nenhum.
  await cdp.click(c, '#cphFuncionalidade_cphCampos_GrdMaterialApoio_BtnMarcarRealizadoMaterialApoio_6');
  await cdp.waitMs(700);
  await cdp.fill(c, '#cphFuncionalidade_cphCampos_TxtConteudoLivreMaterialApoioExecutado', 'Material autoral');

  // 6) Salva e confirma.
  await cdp.click(c, '#cphFuncionalidade_btnAlterar');
  await cdp.waitMs(2200);
  console.log('conteúdo salvo?', await cdp.evaluate(c, `document.body?.innerText.includes('sucesso')`));

  // 7) Frequência: troca de aba, vai na mesma data, calcula o diff (remover quem está
  //    marcado a mais, adicionar quem falta) — NUNCA assuma que a grade está vazia ao
  //    chegar numa data nova, ela pode ter sobra de clique de uma data anterior.
  await cdp.click(c, '#cphFuncionalidade_cphCampos_BtnFrequencia');
  await cdp.waitMs(2200);
  await nav.selecionarMes(c, 'Agosto');
  await nav.gotoDate(c, '2026/8/6', '06/08/2026');

  const faltasEsperadas = ['22121778349', '22121833378']; // matrículas dos alunos ausentes
  const atuais = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeFrequencias .item[data-ausente="True"]')).map(e => e.getAttribute('data-matricula')))`));
  const remover = atuais.filter(m => !faltasEsperadas.includes(m));
  const adicionar = faltasEsperadas.filter(m => !atuais.includes(m));
  for (const mat of [...remover, ...adicionar]) {
    await cdp.clickAndVerify(c, `.listaDeFrequencias .item[data-matricula="${mat}"]`, 'data-ausente', adicionar.includes(mat) ? 'True' : 'False', 6);
  }
  const final = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeFrequencias .item[data-ausente="True"]')).map(e => e.getAttribute('data-matricula')))`)).sort();
  const bateu = JSON.stringify(final) === JSON.stringify([...faltasEsperadas].sort());
  console.log('frequência bateu com o esperado?', bateu, final);
  if (bateu) {
    await cdp.realClick(c, '#cphFuncionalidade_btnAlterar');
    await cdp.waitMs(2500);
    console.log('frequência salva');
  } else {
    console.log('NÃO SALVOU — o estado final não bateu com o esperado, investigue antes de forçar');
  }

  await cdp.close(c);
}

main().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
