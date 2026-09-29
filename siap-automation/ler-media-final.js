const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

const TURMAS = [
  { label: '1ªA Filosofia', serie: '1', letra: 'A', disc: 'Filosofia' },
  { label: '1ªA Historia', serie: '1', letra: 'A', disc: 'Historia' },
  { label: '1ªA Sociologia', serie: '1', letra: 'A', disc: 'Sociologia' },
  { label: '1ªB Filosofia', serie: '1', letra: 'B', disc: 'Filosofia' },
  { label: '1ªB Historia', serie: '1', letra: 'B', disc: 'Historia' },
  { label: '1ªB Sociologia', serie: '1', letra: 'B', disc: 'Sociologia' },
  { label: '2ªA Filosofia', serie: '2', letra: 'A', disc: 'Filosofia' },
  { label: '2ªA Historia', serie: '2', letra: 'A', disc: 'Historia' },
  { label: '2ªA Sociologia', serie: '2', letra: 'A', disc: 'Sociologia' },
  { label: '2ªB Filosofia', serie: '2', letra: 'B', disc: 'Filosofia' },
  { label: '2ªB Historia', serie: '2', letra: 'B', disc: 'Historia' },
  { label: '2ªB Sociologia', serie: '2', letra: 'B', disc: 'Sociologia' },
];

async function lerUma(t, tentativas) {
  tentativas = tentativas || 3;
  for (let tent = 0; tent < tentativas; tent++) {
    const c = await cdp.connect();
    try {
      await nav.navigateToNotas(c, nav.SERIE[t.serie], t.serie + t.letra, nav.DISCIPLINA[t.disc]);
      await cdp.waitMs(3500);

      // instrumentos existentes (nomes dos .lista.listaDeNotas, que sao os
      // instrumentos de nota tipo Atividades Avaliativas / Bloco X / Bloco da Rede)
      let instrumentos = [];
      let mediaBimestral = [];
      for (let i = 0; i < 8; i++) {
        instrumentos = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.lista.listaDeNotas')).map(function(inst){
          var titulo = inst.getAttribute('title') || '';
          var qtdPreenchida = Array.from(inst.querySelectorAll('input')).filter(function(el){ return el.value && el.value.trim()!==''; }).length;
          var qtdTotal = inst.querySelectorAll('.item.subjetiva.nota[data-matricula], .item[data-matricula]').length;
          return { titulo: titulo, qtdPreenchida: qtdPreenchida, qtdTotal: qtdTotal };
        }))`));
        mediaBimestral = JSON.parse(await cdp.evaluate(c, `JSON.stringify((function(){
          var lst = Array.from(document.querySelectorAll('.lista.listaDeTotais')).find(function(l){
            var t = l.querySelector('.cabecalho .titulo');
            return t && t.textContent.trim() === 'Média Bimestral';
          });
          if (!lst) return [];
          return Array.from(lst.querySelectorAll('.itens .item[data-matricula]')).map(function(e){
            return { matricula: e.getAttribute('data-matricula'), valor: (e.textContent||'').replace(/\\u00a0/g,'').trim() };
          });
        })())`));
        if (mediaBimestral.length > 0) break;
        await cdp.waitMs(1000);
      }
      await cdp.close(c);
      if (mediaBimestral.length > 0) return { instrumentos, mediaBimestral };
    } catch (e) {
      console.log('  tentativa falhou:', e.message);
      try { await cdp.close(c); } catch (_) {}
    }
  }
  return { instrumentos: [], mediaBimestral: [] };
}

async function main() {
  const resultado = {};
  for (const t of TURMAS) {
    console.log('lendo', t.label);
    const r = await lerUma(t);
    resultado[t.label] = r;
    console.log('  instrumentos:', r.instrumentos.map(i => i.titulo + '(' + i.qtdPreenchida + '/' + i.qtdTotal + ')').join(', '));
    console.log('  ', r.mediaBimestral.length, 'medias lidas');
  }
  fs.writeFileSync('/tmp/media_final.json', JSON.stringify(resultado, null, 1));
  console.log('SALVO em /tmp/media_final.json');
}
main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
