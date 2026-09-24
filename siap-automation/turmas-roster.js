const cdp = require('./cdp.js');
const nav = require('./nav.js');
const fs = require('fs');

const TURMAS = [
  { turmaId: 'ad19775b-76df-4d42-a794-69f8e51ac2b8', serie:'3', letra:'A', disc:'Historia', label:'Historia 3A' },
  { turmaId: 'e12563ba-a247-40b7-98ab-859b04746712', serie:'2', letra:'B', disc:'Sociologia', label:'Sociologia 2B' },
  { turmaId: '1751766d-cc4e-45a6-9896-cccb22600e30', serie:'3', letra:'A', disc:'Sociologia', label:'Sociologia 3A' },
  { turmaId: 'e1f490b0-5b05-4d0c-80d9-7d9b9291dc5a', serie:'3', letra:'B', disc:'Sociologia', label:'Sociologia 3B' },
  { turmaId: 'edb8cfcc-d18e-4b2e-bef4-55569e727846', serie:'3', letra:'C', disc:'Sociologia', label:'Sociologia 3C' },
  { turmaId: 'b71617c6-08f3-46ba-b235-f199ba320fdc', serie:'3', letra:'C', disc:'Historia', label:'Historia 3C' },
  { turmaId: '7d259734-023d-4e89-bf99-106504b6db36', serie:'2', letra:'A', disc:'Sociologia', label:'Sociologia 2A' },
  { turmaId: 'bea21a02-1459-43e2-a017-0e825cbc3818', serie:'2', letra:'B', disc:'Filosofia', label:'Filosofia 2B' },
  { turmaId: 'da6c3ab0-30a3-4605-926d-c3d19222c459', serie:'3', letra:'B', disc:'Historia', label:'Historia 3B' },
  { turmaId: '7db1c9a8-618c-4bea-b4a4-558cbd5f72ce', serie:'3', letra:'B', disc:'Filosofia', label:'Filosofia 3B' },
  { turmaId: 'efd18cfe-eb2a-4573-9cb3-75ac769b00dd', serie:'2', letra:'A', disc:'Filosofia', label:'Filosofia 2A' },
  { turmaId: 'f1ccea13-cd95-4cd4-8a90-5b298937f514', serie:'3', letra:'C', disc:'Filosofia', label:'Filosofia 3C' },
  { turmaId: 'efb4f475-dda1-4371-9ae7-d42252515b39', serie:'3', letra:'A', disc:'Filosofia', label:'Filosofia 3A' },
  { turmaId: 'b1c2b786-be93-4743-93b7-98063c0da066', serie:'1', letra:'A', disc:'Filosofia', label:'Filosofia 1A' },
  { turmaId: '2e8d57e1-22b8-4427-9fd6-1068650784f7', serie:'1', letra:'B', disc:'Filosofia', label:'Filosofia 1B' },
];

async function main() {
  const c = await cdp.connect();
  const saida = {};
  for (const t of TURMAS) {
    console.log('roster:', t.label);
    await nav.navigateToNotas(c, nav.SERIE[t.serie], t.serie + t.letra, nav.DISCIPLINA[t.disc]);
    await cdp.waitMs(1300);
    const roster = JSON.parse(await cdp.evaluate(c, `JSON.stringify(Array.from(document.querySelectorAll('.listaDeAlunos .item')).map(e=>({nome:(e.getAttribute('data-nome')||e.innerText||'').trim().replace(/^\\d+\\.\\s*/,''), matricula:e.getAttribute('data-matricula')})))`));
    saida[t.turmaId] = { label: t.label, roster };
  }
  fs.writeFileSync(__dirname + '/rosters.json', JSON.stringify(saida, null, 1));
  console.log('salvo em rosters.json');
  await cdp.close(c);
}
main().catch(e => { console.error('ERRO', e.message); process.exit(1); });
