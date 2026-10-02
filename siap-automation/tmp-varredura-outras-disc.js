const cdp = require('./cdp.js');

async function setSelReconectando(sel, value, minOptions) {
  minOptions = minOptions || 2;
  let c = await cdp.connect();
  const js = `(async function(){
    for (let i = 0; i < 20; i++) {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (el && el.options.length >= ${minOptions}) {
        el.value = ${JSON.stringify(value)};
        el.dispatchEvent(new Event('change', {bubbles:true}));
        return 'OK-' + el.value;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    return 'TIMEOUT';
  })()`;
  const r = await cdp.evaluate(c, js);
  await cdp.waitMs(1500);
  return r;
}

const SERIE = { '1': '5711', '2': '5712' };
const DISC = { Sociologia: '16', Filosofia: '15', EstudoOrientado: '1841' };

async function abrirTurma(serieNum, turmaLetra, discNome) {
  let c = await cdp.connect();
  await cdp.evaluate(c, "location.href='https://siap.educacao.go.gov.br/DiarioEscolarListagem.aspx'");
  await cdp.waitMs(2500);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlComposicao', '571', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlSerie', SERIE[serieNum], 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlTurno', '1', 2);
  await setSelReconectando('#cphFuncionalidade_cphCampos_ddlDisciplina', DISC[discNome], 2);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnListar');
  await cdp.waitMs(2000);
  const alvo = serieNum + turmaLetra;
  const idx = await cdp.evaluate(c, `(function(){ const rows=Array.from(document.querySelectorAll('#cphFuncionalidade_gdvListagem tr')); const re=new RegExp('\\\\b${alvo}\\\\b'); for(let i=1;i<rows.length;i++){ if(re.test(rows[i].innerText)) return i; } return -1; })()`);
  if (idx < 0) return { erro: 'TURMA-NAO-LISTADA' };
  await cdp.evaluate(c, 'document.querySelectorAll("#cphFuncionalidade_gdvListagem tr")[' + idx + '].click()');
  await cdp.waitMs(1500);
  c = await cdp.connect();
  await cdp.click(c, '#cphFuncionalidade_btnAuxiliar3');
  await cdp.waitMs(3000);
  c = await cdp.connect();
  const url = await cdp.evaluate(c, 'location.href');
  if (!url.includes('NotasModeloEdicao')) return { erro: 'NAO-CHEGOU-NOTAS: ' + url };

  const dados = await cdp.evaluate(c, `(function(){
    var lstMB = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){var t=l.querySelector('.cabecalho .titulo'); return t && t.textContent.trim()==='Média Bimestral';});
    if (!lstMB) return JSON.stringify({ erro: 'SEM-MEDIA-BIMESTRAL' });
    var recs = {};
    Array.from(document.querySelectorAll('.item.recuperacao.nota')).forEach(function(r){ recs[r.getAttribute('data-matricula')] = r.getAttribute('data-nota'); });
    var alunos = {};
    Array.from(document.querySelectorAll('.listaDeAlunos .item')).forEach(function(e){
      alunos[e.getAttribute('data-matricula')] = (e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,'');
    });
    var out = [];
    Array.from(lstMB.querySelectorAll('.item[data-matricula]')).forEach(function(it){
      var mat = it.getAttribute('data-matricula');
      out.push({ mat: mat, nome: alunos[mat]||'???', mb: it.textContent.trim(), rec: recs[mat]||'' });
    });
    return JSON.stringify(out);
  })()`);
  return { dados: JSON.parse(dados) };
}

async function main() {
  const combos = [
    ['1', 'A', 'Sociologia'], ['1', 'B', 'Sociologia'], ['2', 'A', 'Sociologia'], ['2', 'B', 'Sociologia'],
    ['1', 'A', 'Filosofia'], ['1', 'B', 'Filosofia'], ['2', 'A', 'Filosofia'], ['2', 'B', 'Filosofia'],
    ['1', 'A', 'EstudoOrientado'], ['1', 'B', 'EstudoOrientado'], ['2', 'A', 'EstudoOrientado'], ['2', 'B', 'EstudoOrientado'],
  ];
  const resultado = {};
  for (const [serie, letra, disc] of combos) {
    const label = serie + letra + '-' + disc;
    try {
      const r = await abrirTurma(serie, letra, disc);
      if (r.erro) { console.log(label, 'ERRO:', r.erro); resultado[label] = { erro: r.erro }; continue; }
      const abaixo = r.dados.filter(a => {
        const v = parseFloat((a.mb || '').replace(',', '.'));
        return !isNaN(v) && v < 6;
      });
      console.log(label, '- total:', r.dados.length, '- abaixo de 6:', abaixo.length);
      resultado[label] = abaixo;
    } catch (e) {
      console.log(label, 'EXCECAO:', e.message);
      resultado[label] = { erro: e.message };
    }
  }
  require('fs').writeFileSync('/tmp/varredura_outras_disciplinas.json', JSON.stringify(resultado, null, 1));
  console.log('SALVO');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
