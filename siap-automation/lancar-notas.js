/* Lança notas de "Atividades Avaliativas" (instrumento subjetivo) numa turma,
   a partir de uma lista [{matricula, nome, media}] com dados JÁ frescos do
   Leciona (buscar sempre ao vivo antes de chamar isto — nunca reusar um JSON
   de sessão anterior, a média pode ter mudado).

   MÉTODO REAL (descoberto em 21/09/2026, depois de horas com o método de
   blur simulado falhando silenciosamente pra alunos aleatórios): usa
   `fetch()` direto pro endpoint `WMAtualizaNotaSubjetiva`, dentro do
   contexto da própria página (mesma origem, cookies/sessão válidos
   automaticamente). O clique+blur simulado na interface é comprovadamente
   pouco confiável — falha silenciosamente pra alguns alunos sem disparar
   nem o POST, mesmo com o mesmo handler jQuery vinculado que funciona pra
   outros. O `fetch()` direto, com o `indiceAvaliacao` correto (o `data-id`
   do `.lista.listaDeNotas` daquele instrumento), é 100% confiável nos
   testes feitos. A resposta do endpoint retorna `{Ciclos, Parcial}` — o
   campo `Nota` ali é a MÉDIA RECALCULADA (ciclo/parcial), não um eco do
   valor enviado; não comparar o valor da resposta com o que foi mandado,
   só confiar em `status === 200` e, melhor ainda, confirmar com um reload
   de página fresco depois.

   CORREÇÃO IMPORTANTE (21/09/2026): o "Enviar para o SIGE" -> "Sim" NÃO é,
   na verdade, obrigatório pra persistir — confirmado repetidas vezes com
   `fetch()` direto + reload fresco da página, sem nunca conseguir confirmar
   o SIGE automaticamente. O sumiço da 1ªB em 20/09 não era falta de SIGE;
   era o método de blur simulado falhando silenciamente (a causa real só
   foi entendida depois, ver acima). `enviarParaSige` continua exportado e
   vale tentar (é o fluxo "oficial"), mas **não bloquear nem re-tentar
   indefinidamente se falhar** — confirme com reload fresco em vez disso. */
const cdp = require('./cdp.js');

/* Acha o data-id do instrumento "Atividades Avaliativas" (ou variante,
   ex. "- seminarios") dentro de "Av. Subjetivas", na página de Notas já
   aberta. Pode haver mais de um instrumento na seção; usa o que contém
   todas as matrículas da lista de alunos, ou o único existente. */
async function achaIndiceAvaliacao(c, matriculasAlvo) {
  const instrumentos = await cdp.evaluate(c, `(function(){
    const titulos = Array.from(document.querySelectorAll('.titulo'));
    const hit = titulos.find(e => (e.innerText||'').trim()==='Av. Subjetivas');
    if (!hit) return JSON.stringify([]);
    const conteudo = hit.closest('.itemConteudo').querySelector('.conteudo');
    return JSON.stringify(Array.from(conteudo.querySelectorAll('.lista.listaDeNotas')).map(function(inst){
      return {
        id: inst.getAttribute('data-id'),
        titulo: inst.getAttribute('title'),
        alunos: Array.from(inst.querySelectorAll('.item.subjetiva.nota')).map(i => i.getAttribute('data-matricula'))
      };
    }));
  })()`);
  const lista = JSON.parse(instrumentos);
  if (lista.length === 0) return null;
  if (lista.length === 1) return lista[0].id;
  const match = lista.find(inst => matriculasAlvo.every(m => inst.alunos.includes(m)));
  return match ? match.id : lista[0].id;
}

async function lancarNotasSubjetiva(c, alunos) {
  const indiceAvaliacao = await achaIndiceAvaliacao(c, alunos.map(a => a.matricula));
  if (!indiceAvaliacao) {
    return alunos.map(a => ({ ...a, ok: false, erro: 'instrumento nao encontrado' }));
  }

  const resultados = [];
  for (const { matricula, nome, media } of alunos) {
    const nota = Math.round(media * 10) / 10;
    const resp = await cdp.evaluate(c, `(async function(){
      try {
        const r = await fetch('/DiarioDoProfessorWebMethods.aspx/WMAtualizaNotaSubjetiva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ indiceAvaliacao: ${JSON.stringify(indiceAvaliacao)}, matricula: ${JSON.stringify(matricula)}, nota: ${nota} })
        });
        const texto = await r.text();
        return JSON.stringify({ status: r.status, texto: texto.slice(0,300) });
      } catch (e) {
        return JSON.stringify({ erro: e.message });
      }
    })()`);
    const parsed = JSON.parse(resp);
    const ok = parsed.status === 200;

    // atualiza o input visivel tambem, pra refletir na tela sem precisar reload
    await cdp.evaluate(c, `(function(){
      const el = document.querySelector('.item.subjetiva.nota[data-matricula="${matricula}"] input');
      if (el) el.value = ${JSON.stringify(media.toFixed(1).replace('.', ','))};
      const item = document.querySelector('.item.subjetiva.nota[data-matricula="${matricula}"]');
      if (item) item.setAttribute('data-nota', ${JSON.stringify(media.toFixed(1).replace('.', ','))});
    })()`);

    resultados.push({ matricula, nome, media, ok, resposta: parsed });
    await cdp.waitMs(300);
  }
  return resultados;
}

/* Clica "Enviar para o SIGE" e confirma "Sim" no diálogo — passo final
   obrigatório pra persistir de verdade. Retorna true se o fluxo completou. */
async function enviarParaSige(c) {
  const btnExiste = await cdp.evaluate(c, `!!document.querySelector('#cphFuncionalidade_cphCampos_btnEnviarBoletim')`);
  if (!btnExiste) return { ok: false, motivo: 'botao Enviar para o SIGE nao encontrado' };

  let achou = false;
  for (let tent = 0; tent < 5 && !achou; tent++) {
    await cdp.realClick(c, '#cphFuncionalidade_cphCampos_btnEnviarBoletim');
    await cdp.waitMs(1800);
    achou = await cdp.evaluate(c, `(function(){
      const ds = Array.from(document.querySelectorAll('.ui-dialog')).filter(d => getComputedStyle(d).display !== 'none');
      return !!ds.find(d => (d.querySelector('.ui-dialog-title')?.textContent || '').includes('Confirmação de envio'));
    })()`);
    if (!achou) await cdp.waitMs(1200);
  }
  if (!achou) return { ok: false, motivo: 'dialogo de confirmacao nao apareceu apos 5 tentativas' };

  let cliqueSimOk = false;
  for (let tent = 0; tent < 5 && !cliqueSimOk; tent++) {
    const btnSimAchado = await cdp.evaluate(c, `(function(){
      const ds = Array.from(document.querySelectorAll('.ui-dialog')).filter(d => getComputedStyle(d).display !== 'none');
      const confirmacao = ds.find(d => (d.querySelector('.ui-dialog-title')?.textContent || '').includes('Confirmação de envio'));
      if (!confirmacao) return 'dialogo-sumiu';
      const btnSim = Array.from(confirmacao.querySelectorAll('button, .ui-button, a')).find(b => /sim/i.test((b.textContent||'').trim()));
      if (!btnSim) return 'sem-botao-sim';
      btnSim.click();
      return 'clicou';
    })()`);
    await cdp.waitMs(1200);
    const aindaAberto = await cdp.evaluate(c, `(function(){
      const ds = Array.from(document.querySelectorAll('.ui-dialog')).filter(d => getComputedStyle(d).display !== 'none');
      return !!ds.find(d => (d.querySelector('.ui-dialog-title')?.textContent || '').includes('Confirmação de envio'));
    })()`);
    cliqueSimOk = !aindaAberto;
    if (!cliqueSimOk) await cdp.waitMs(800);
  }
  if (!cliqueSimOk) return { ok: false, motivo: 'clicou Sim mas o dialogo nao fechou' };

  await cdp.waitMs(1500);
  return { ok: true };
}

module.exports = { lancarNotasSubjetiva, enviarParaSige };
