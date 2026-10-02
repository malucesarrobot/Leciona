const fs = require('fs');
const alunos = JSON.parse(fs.readFileSync('/tmp/alunos_fresh.json'));
const dados = JSON.parse(fs.readFileSync('/tmp/mb_1a_historia.json'));
const porMat = {};
Object.entries(alunos).forEach(([id, a]) => { if (a.matricula) porMat[a.matricula] = { id, nome: a.nome }; });
const patch = {};
let n = 0;
Object.entries(dados).forEach(([mat, d]) => {
  const al = porMat[mat];
  console.log((al ? al.nome : '???'), '|', mat, '| MP:', d.mp, '| Rec:', d.rec || '-', '| MB:', d.mb);
  if (al && d.mb) { patch['/leciona/alunos/' + al.id + '/mediaFinalBimestre'] = d.mb; n++; }
});
fs.writeFileSync('/tmp/patch-mb-1a-historia.json', JSON.stringify(patch, null, 1));
console.log('patch com', n, 'alunos');
