const fs = require('fs');
const alunos = JSON.parse(fs.readFileSync('/tmp/alunos_fresh.json'));
const dados = JSON.parse(fs.readFileSync('/tmp/mb_2a_historia.json'));
const porMat = {};
Object.entries(alunos).forEach(([id, a]) => { if (a.matricula) porMat[a.matricula] = id; });
const patch = {};
let n = 0;
Object.entries(dados).forEach(([mat, mb]) => {
  const id = porMat[mat];
  if (!id || !mb) return;
  patch['/leciona/alunos/' + id + '/mediaFinalBimestre'] = mb;
  n++;
});
fs.writeFileSync('/tmp/patch-mb-2a-historia.json', JSON.stringify(patch, null, 1));
console.log('patch com', n, 'alunos');
