const fs = require('fs');
const alunos = JSON.parse(fs.readFileSync('/tmp/alunos_fresh.json'));
const notasCtrl = JSON.parse(fs.readFileSync('/tmp/notas_ctrl_fresh.json'));
const atividades = JSON.parse(fs.readFileSync('/tmp/atividades_fresh.json'));
const mediaModoRaw = JSON.parse(fs.readFileSync('/tmp/media_modo_fresh.json')) || {};

const turmaId = 'bb195fb6-3b88-4f17-94c0-43bb6dd1d1df'; // 1ªA Historia

const notaIdx = {};
Object.values(notasCtrl).forEach(n => {
  if (!n || !n.alunoId || !n.atividadeId) return;
  notaIdx[n.alunoId + '|' + n.atividadeId] = n;
});
function notaDoAluno(alunoId, atividadeId) { return notaIdx[alunoId + '|' + atividadeId] || null; }

const atvs = Object.entries(atividades).filter(([id, av]) => {
  const disc = (av.disciplina || '').toString();
  const turmaIds = av.turmaIds || [];
  return /hist[oó]ria/i.test(disc) && turmaIds.includes(turmaId);
}).map(([id, av]) => ({ id, ...av }));
console.log('atividades Historia 1A:', atvs.length);

function getMediaModo(tId) { return mediaModoRaw[tId] || 'ponderada'; }

function mediaAluno(alunoId, atvs, tId) {
  const modo = getMediaModo(tId);
  const normais = atvs.filter(av => !(av.tipo === 'extra' || av.extra === true));
  const extras = atvs.filter(av => av.tipo === 'extra' || av.extra === true);
  const pares = normais.map(av => {
    const n = notaDoAluno(alunoId, av.id);
    let notaEm10;
    if (av.checklist === true) {
      notaEm10 = (n && n.valor > 0) ? 10 : 0;
    } else {
      if (!n || n.valor == null) notaEm10 = 0;
      else { const max = av.valorMax || 10; notaEm10 = max > 0 ? (n.valor / max) * 10 : n.valor; }
    }
    const peso = modo === 'aritmetica' ? 1 : (av.peso || 1);
    return { v: notaEm10, p: peso };
  });
  if (!pares.length && !extras.length) return null;
  let base = null;
  if (pares.length) {
    const total = pares.reduce((s, x) => s + x.v * x.p, 0);
    const pesos = pares.reduce((s, x) => s + x.p, 0);
    base = pesos > 0 ? total / pesos : null;
  }
  const bonusDecimos = extras.reduce((s, av) => {
    const n = notaDoAluno(alunoId, av.id);
    if (av.checklist === true) return s + ((n && n.valor > 0) ? (av.peso || 1) : 0);
    return s + ((n && n.valor != null) ? n.valor : 0);
  }, 0);
  if (base == null && !bonusDecimos) return null;
  return Math.min(10, (base || 0) + bonusDecimos);
}

const alunosTurma = Object.entries(alunos).filter(([id, a]) => a.turmaId === turmaId && a.ativo !== false);
console.log('alunos ativos na turma:', alunosTurma.length);
const resultado = [];
alunosTurma.forEach(([id, a]) => {
  const m = mediaAluno(id, atvs, turmaId);
  if (m != null && a.matricula) resultado.push([a.matricula, Math.round(m * 100) / 100, a.nome, a.recuperacaoSiap || null]);
});
resultado.sort((a, b) => a[1] - b[1]);
resultado.forEach(r => console.log(r[2], '|', r[0], '|', r[1], '| rec:', r[3] || '-'));
fs.writeFileSync('/tmp/medias_1a_historia.json', JSON.stringify(resultado.map(r => [r[0], r[1]])));
console.log('TOTAL:', resultado.length);
