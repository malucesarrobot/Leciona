/* Lança frequência de hoje pras turmas EFG, resolvendo matricula por nome
   contra o roster do SIAP quando faltar (mesmo padrão da noite toda). */
const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

const TARGET_ID = process.argv[2] || 'AFBC71E2D4C87D7C71C88501C3929EAD';
function normNome(s){ return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().trim(); }

function toCanonELabel(dataISO) {
  const [y, m, d] = dataISO.split('-').map(Number);
  return { canon: `${y}/${m}/${d}`, label: `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}` };
}

async function main() {
  const hoje = new Date().toISOString().slice(0,10);
  const { canon, label } = toCanonELabel(hoje);
  const turmasCfg = JSON.parse(fs.readFileSync(__dirname + '/freq-hoje.json', 'utf8'));
  const c = await cdp.connect(TARGET_ID);
  const relatorio = [];

  for (const t of turmasCfg) {
    console.log(`\n=== ${t.label} ===`);
    await nav.navigateToFrequencia(c, nav.SERIE[t.serie], t.serie + t.letra, nav.DISCIPLINA[t.disc], 'Setembro');

    // roster pra resolver quem falta matricula
    const roster = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeAlunos .item')).map(e=>({nome:(e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,''), matricula:e.getAttribute('data-matricula')})))`));
    const porNome = {}; roster.forEach(r => porNome[normNome(r.nome)] = r.matricula);

    const faltasResolvidas = [];
    const naoResolvidas = [];
    for (const chave of t.faltas) {
      if (chave.startsWith('?')) {
        const nome = chave.slice(1);
        const mat = porNome[normNome(nome)];
        if (mat) faltasResolvidas.push(mat); else naoResolvidas.push(nome);
      } else faltasResolvidas.push(chave);
    }
    if (naoResolvidas.length) console.log('  NAO RESOLVIDOS:', naoResolvidas);

    const tdInfo = await cdp.evaluate(c, `(function(){ const td=document.querySelector('td[data-canonica="${canon}"]'); return td?JSON.stringify({cls:td.className, lanc:td.getAttribute('data-lancamento-frequencia')}):'NAO-ACHADA'; })()`);
    console.log('  celula hoje:', tdInfo);
    const td = tdInfo !== 'NAO-ACHADA' ? JSON.parse(tdInfo) : null;
    if (!td || !/dialog letivo/.test(td.cls)) {
      console.log('  dia nao letivo pra essa turma no SIAP, pulando');
      relatorio.push({ label: t.label, status: 'NAO-LETIVO' });
      continue;
    }

    // vai pra data com clique paciente (mesmo metodo que funcionou hoje mais cedo)
    const rect = await cdp.evaluate(c, `(function(){ const el=document.querySelector('td[data-canonica="${canon}"]'); el.scrollIntoView({block:'center',behavior:'instant'}); const r=el.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2}); })()`);
    const { x, y } = JSON.parse(rect);
    let dataOk = false;
    for (let tent = 0; tent < 3 && !dataOk; tent++) {
      await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, c.sessionId);
      await cdp.waitMs(150);
      await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, c.sessionId);
      await cdp.waitMs(150);
      await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, c.sessionId);
      for (let i = 0; i < 10 && !dataOk; i++) {
        await cdp.waitMs(1000);
        const d = await cdp.evaluate(c, `document.querySelector('#cphFuncionalidade_cphCampos_txtDataSelecionada')?.value`);
        if (d === label) dataOk = true;
      }
    }
    console.log('  data confirmada?', dataOk);
    if (!dataOk) { relatorio.push({ label: t.label, status: 'FALHOU-DATA' }); continue; }

    const atuais = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeFrequencias .item[data-ausente="True"]')).map(e => e.getAttribute('data-matricula')))`));
    const remover = atuais.filter(m => !faltasResolvidas.includes(m));
    const adicionar = faltasResolvidas.filter(m => !atuais.includes(m));
    console.log('  atuais:', atuais.length, 'remover:', remover.length, 'adicionar:', adicionar.length);

    if (remover.length === 0 && adicionar.length === 0) {
      console.log('  JA-OK');
      relatorio.push({ label: t.label, status: 'JA-OK', naoResolvidos: naoResolvidas });
      continue;
    }

    for (const mat of [...remover, ...adicionar]) {
      await cdp.clickAndVerify(c, `.listaDeFrequencias .item[data-matricula="${mat}"]`, 'data-ausente', adicionar.includes(mat) ? 'True' : 'False', 6);
    }
    const final = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeFrequencias .item[data-ausente="True"]')).map(e => e.getAttribute('data-matricula')))`)).sort();
    const bateu = JSON.stringify(final) === JSON.stringify([...faltasResolvidas].sort());
    console.log('  bateu?', bateu, final);
    if (bateu) {
      await cdp.realClick(c, '#cphFuncionalidade_btnAlterar');
      await cdp.waitMs(2000);
      console.log('  SALVO');
      relatorio.push({ label: t.label, status: 'SALVO', naoResolvidos: naoResolvidas });
    } else {
      relatorio.push({ label: t.label, status: 'ERRO-DIFF', esperado: faltasResolvidas, atual: final });
    }
  }

  await cdp.close(c);
  console.log('\n=== RELATORIO ===');
  console.log(JSON.stringify(relatorio, null, 1));
}
main().catch(e => { console.error('FALHOU GERAL:', e.message); process.exit(1); });
