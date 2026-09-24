/* Sincroniza "Atividades Avaliativas" (Av. Subjetivas) em várias turma-disciplinas
   de uma vez, a partir de sync-completo.json (matricula-ou-?nome : media).
   Pra cada aluno sem matrícula no Leciona (prefixo "?"), casa pelo roster do
   próprio SIAP (mesma página, sem custo extra). SÓ ESCREVE quem o valor atual
   na tela diverge do esperado — nunca reescreve quem já está certo. */
const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

function normNome(s){ return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().trim(); }

async function achaIndiceAvaliacaoSubjetiva(c) {
  const instrumentos = await cdp.evaluate(c, `(function(){
    const titulos = Array.from(document.querySelectorAll('.titulo'));
    const hit = titulos.find(e => { const t=(e.innerText||'').trim(); return t==='Av. Subjetivas' || t==='Av. Livres'; }); // 9º ano/CEPI usa "Av. Livres"
    if (!hit) return JSON.stringify([]);
    const conteudo = hit.closest('.itemConteudo').querySelector('.conteudo');
    return JSON.stringify(Array.from(conteudo.querySelectorAll('.lista.listaDeNotas')).map(function(inst){
      return { id: inst.getAttribute('data-id'), titulo: inst.getAttribute('title') };
    }));
  })()`);
  const lista = JSON.parse(instrumentos);
  const hit = lista.find(x => /atividades\s+avaliativ/i.test(x.titulo||''));
  return hit ? hit.id : (lista[0] ? lista[0].id : null);
}

async function processarTurma(c, turmaCfg, log) {
  const discValue = nav.DISCIPLINA[turmaCfg.disc];
  const cepi = turmaCfg.cepi === true;
  const serieValue = cepi ? nav.CEPI.serie9 : nav.SERIE[turmaCfg.serie];
  const turmaLetra = turmaCfg.serie + turmaCfg.letra;
  const opts = cepi ? { composicao: nav.CEPI.composicao, turno: nav.CEPI.turno } : undefined;

  await nav.navigateToNotas(c, serieValue, turmaLetra, discValue, opts);
  await cdp.waitMs(3000); // 1500 dava "sem-instrumento" flaky em sessao longa; 3000 confirmado estavel

  const roster = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeAlunos .item')).map(e=>({nome:(e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,''), matricula:e.getAttribute('data-matricula'), situacao:e.getAttribute('data-codigosituacao')})))`));
  const porNomeSiap = {};
  roster.forEach(r => { porNomeSiap[normNome(r.nome)] = r.matricula; });

  // Resolve matricula (Leciona já tinha, ou casa por nome no roster do SIAP)
  const resolvidos = [];
  const naoResolvidos = [];
  for (const [chave, media] of turmaCfg.alunos) {
    if (chave.startsWith('?')) {
      const nome = chave.slice(1);
      const mat = porNomeSiap[nome];
      if (mat) resolvidos.push({ matricula: mat, media, nomeOrigem: nome });
      else naoResolvidos.push(nome);
    } else {
      resolvidos.push({ matricula: chave, media });
    }
  }

  const indiceAvaliacao = await achaIndiceAvaliacaoSubjetiva(c);
  if (!indiceAvaliacao) {
    log('SEM INSTRUMENTO "Atividades Avaliativas" nesta turma — pulando');
    return { label: turmaCfg.label, erro: 'sem-instrumento', naoResolvidos };
  }

  // Lê os valores atuais pra só escrever o que mudou
  const atuaisRaw = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.item.subjetiva.nota[data-matricula]')).map(e=>({mat:e.getAttribute('data-matricula'), val:(e.querySelector('input')?.value||'').trim()})))`));
  const atuais = {};
  atuaisRaw.forEach(x => { atuais[x.mat] = x.val; });

  function paraVirgula(n) { return n.toFixed(1).replace('.', ','); }

  const paraEscrever = resolvidos.filter(r => {
    const esperado = paraVirgula(Math.round(r.media * 10) / 10);
    const atual = atuais[r.matricula];
    return atual !== esperado;
  });

  log(`resolvidos=${resolvidos.length} naoResolvidos=${naoResolvidos.length} jaCorretos=${resolvidos.length - paraEscrever.length} paraEscrever=${paraEscrever.length}`);

  const resultados = [];
  for (const { matricula, media } of paraEscrever) {
    const nota = Math.round(media * 10) / 10;
    const resp = await cdp.evaluate(c, `(async function(){
      try {
        const r = await fetch('/DiarioDoProfessorWebMethods.aspx/WMAtualizaNotaSubjetiva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ indiceAvaliacao: ${JSON.stringify(indiceAvaliacao)}, matricula: ${JSON.stringify(matricula)}, nota: ${nota} })
        });
        return JSON.stringify({ status: r.status });
      } catch (e) { return JSON.stringify({ erro: e.message }); }
    })()`);
    const parsed = JSON.parse(resp);
    resultados.push({ matricula, media: nota, ok: parsed.status === 200 });
    await cdp.waitMs(280);
  }

  const falhas = resultados.filter(r => !r.ok);

  // Pedido explicito da Malu: sempre reenviar pro SIGE apos atualizar uma turma,
  // pra propagar as notas gravadas no Diario do Professor pro sistema de boletim.
  let sigeReenviado = false;
  const temBotaoSige = await cdp.evaluate(c, `!!document.querySelector('#cphFuncionalidade_cphCampos_btnEnviarBoletim')`);
  if (temBotaoSige) {
    await cdp.click(c, '#cphFuncionalidade_cphCampos_btnEnviarBoletim');
    await cdp.waitMs(2000);
    sigeReenviado = true;
  }

  return {
    label: turmaCfg.label,
    totalAlunos: turmaCfg.alunos.length,
    resolvidos: resolvidos.length,
    naoResolvidos,
    jaCorretos: resolvidos.length - paraEscrever.length,
    escritos: resultados.length,
    falhas: falhas.length,
    detalheFalhas: falhas,
    sigeReenviado
  };
}

async function main() {
  const arquivo = process.argv[3] || 'sync-completo.json';
  const targetId = process.argv[2] || undefined;
  const turmasCfg = JSON.parse(fs.readFileSync(__dirname + '/' + arquivo, 'utf8'));
  const c = await cdp.connect(targetId);
  const relatorioFinal = [];
  for (const turmaCfg of turmasCfg) {
    console.log(`\n=== ${turmaCfg.label} ===`);
    try {
      const r = await processarTurma(c, turmaCfg, (m) => console.log('  ' + m));
      relatorioFinal.push(r);
      console.log('  RESULTADO:', JSON.stringify(r));
    } catch (e) {
      console.log('  ERRO GERAL:', e.message);
      relatorioFinal.push({ label: turmaCfg.label, erro: e.message });
    }
  }
  await cdp.close(c);
  console.log('\n\n=== RELATORIO FINAL ===');
  console.log(JSON.stringify(relatorioFinal, null, 1));
  fs.writeFileSync(__dirname + '/relatorio-sync.json', JSON.stringify(relatorioFinal, null, 1));
}

main().catch(e => { console.error('FALHOU GERAL:', e.message); process.exit(1); });
