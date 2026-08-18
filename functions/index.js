/* Leciona — Cloud Functions
   Proxy da API Anthropic: a chave fica só aqui (Secret Manager), nunca no
   navegador. Padrão espelhado do projeto Iuris (chatComAssistente), sem o
   que é específico de lá (anexos, ferramentas de agenda, geração de docx).
*/
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp();
const rtdb = admin.database();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
// IMPORT_SECRET fica comentado junto com importarPlanilhaHttp mais abaixo —
// só declarar já exige valor no deploy, mesmo sem nenhuma function usando.
// const IMPORT_SECRET = defineSecret('IMPORT_SECRET');

// E-mails autorizados a usar a IA do Leciona.
const EMAILS_AUTORIZADOS = ['prof.malufc@gmail.com', 'malu.cesar@gmail.com'];

function verificarAcesso(request) {
  if (!request.auth || !request.auth.token.email) {
    throw new HttpsError('unauthenticated', 'Faça login para usar a IA.');
  }
  const email = request.auth.token.email.toLowerCase();
  if (!EMAILS_AUTORIZADOS.map((e) => e.toLowerCase()).includes(email)) {
    throw new HttpsError('permission-denied', 'Este e-mail não tem acesso à IA do Leciona.');
  }
  return email;
}

/* =========================================================
   Importação da planilha de frequência/ocorrências do Arlan
   (Google Sheets público, uma linha por falta/ocorrência,
   atualizado diariamente pela coordenação — só cobre as
   turmas EFG). Lançamos como `leciona/chamadas` (falta) e
   `leciona/qualitativa` (ocorrência disciplinar, -0.1 em
   CADA disciplina que a professora dá pra aquela turma —
   decisão da professora: reflete comportamento geral, não
   de uma matéria só).

   Idempotência: cada chamada criada e cada ocorrência lançada
   fica marcada em `leciona/_importLog`, então rodar de novo
   (todo dia, ou sob demanda) não duplica nem recria o que a
   professora já editou/apagou manualmente depois. Chamada já
   existente pra aquele turma+dia (feita na hora, na aula)
   nunca é sobrescrita. Nomes que não batem com nenhum aluno
   da turma (ou batem com mais de um) viram um registro em
   `leciona/_importPendencias` em vez de arriscar lançar errado. */

const PLANILHA_ID = '14OgFpDNC8NDosCX6uoVSxqPdyMi_mRKx';
const IMPORT_START_DATE = '2026-08-03'; // início da faixa coberta pela planilha atual (3º bimestre 2026)

function urlAba(nomeAba) {
  return 'https://docs.google.com/spreadsheets/d/' + PLANILHA_ID + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(nomeAba);
}

function parseCSV(texto) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else { aspas = false; } }
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}
function csvParaObjetos(texto) {
  const linhas = parseCSV(texto).filter((l) => l.some((c) => c !== ''));
  if (!linhas.length) return [];
  const cabecalho = linhas[0].map((h) => h.trim());
  return linhas.slice(1).map((l) => {
    const o = {};
    cabecalho.forEach((h, i) => { if (h) o[h] = (l[i] || '').trim(); });
    return o;
  });
}

function normNome(s) {
  return (s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}
const STOPWORDS_NOME = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E']);
function tokensRelevantes(s) { return normNome(s).split(' ').filter((t) => t && !STOPWORDS_NOME.has(t)); }

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = []; for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function tokensBatem(a, b) {
  if (a === b) return true;
  const limite = (a.length >= 7 || b.length >= 7) ? 2 : (a.length >= 4 && b.length >= 4 ? 1 : 0);
  if (!limite) return false;
  return Math.abs(a.length - b.length) <= limite && levenshtein(a, b) <= limite;
}
/* Casa um nome da planilha (pode vir incompleto, com apelido, ou com
   1-2 letras trocadas) contra o roster de UMA turma-disciplina do
   Leciona. Só retorna 'ok' quando exatamente um aluno cobre TODOS os
   tokens relevantes do nome buscado — ambíguo ou sem match viram
   pendência em vez de chute. */
function encontrarAluno(nomeAlvo, roster) {
  const alvoTokens = tokensRelevantes(nomeAlvo);
  if (!alvoTokens.length) return { status: 'sem_nome' };
  const nAlvo = normNome(nomeAlvo);
  const exato = roster.find((r) => normNome(r.nome) === nAlvo);
  if (exato) return { status: 'ok', aid: exato.aid };
  const cobrem = roster.filter((r) => alvoTokens.every((t) => r.tokens.some((rt) => tokensBatem(t, rt))));
  if (cobrem.length === 1) return { status: 'ok', aid: cobrem[0].aid };
  if (cobrem.length > 1) return { status: 'ambiguo', candidatos: cobrem.map((c) => ({ aid: c.aid, nome: c.nome })) };
  return { status: 'nao_encontrado' };
}

function temAula(grade, wd) {
  if (!grade) return false;
  if (Array.isArray(grade)) return !!grade[wd];
  return !!(grade[String(wd)] || grade[wd]);
}
function isoDeDataBr(br) {
  const [d, m, a] = (br || '').split('/');
  if (!d || !m || !a) return null;
  return a + '-' + m + '-' + d;
}

const MOTIVO_MAP_OCORRENCIA = {
  'Uso indevido de celular / eletrônicos': 'celular',
  'Saída da sala sem permissão': 'comportamento',
  'Conflito verbal / Discussão com colega': 'comportamento',
  'Desrespeito ao professor ou funcionário': 'comportamento',
};
const MOTIVO_LABEL = { celular: 'Uso de celular', comportamento: 'Comportamento inadequado', outro: 'Outro' };

/* Cópia do SCHEDULE do index.html (o quadro de horário real que a professora
   edita direto lá) — precisa ficar em sync manualmente: sempre que o
   SCHEDULE do index.html mudar, atualizar aqui também. É a MESMA fonte que
   `gradeDe()` usa no cliente pra decidir os dias de aula da Chamada; se as
   duas divergirem, a importação cria chamada num dia que a Chamada não
   mostra mais (ou vice-versa). */
const SCHEDULE=[
  // Segunda — EFG
  {dia:1,ini:'10:45',fim:'11:35',serie:2,letra:'B',disc:'Sociologia',unidade:'EFG'},
  {dia:1,ini:'12:25',fim:'13:15',serie:3,letra:'A',disc:'Filosofia',unidade:'EFG'},
  // Terça — EFG (manhã) + CEPI Marajó (tarde)
  {dia:2,ini:'07:15',fim:'08:05',serie:3,letra:'B',disc:'História',unidade:'EFG'},
  {dia:2,ini:'10:45',fim:'11:35',serie:3,letra:'C',disc:'História',unidade:'EFG'},
  {dia:2,ini:'11:35',fim:'12:25',serie:2,letra:'A',disc:'História',unidade:'EFG'},
  {dia:2,ini:'12:25',fim:'13:15',serie:3,letra:'A',disc:'História',unidade:'EFG'},
  {dia:2,ini:'15:40',fim:'16:30',serie:9,letra:'A',disc:'História',unidade:'CEPI Marajó'},
  // Quarta — EFG (manhã) + CEPI Marajó (tarde)
  {dia:3,ini:'07:15',fim:'08:05',serie:2,letra:'B',disc:'História',unidade:'EFG'},
  {dia:3,ini:'08:05',fim:'08:55',serie:1,letra:'B',disc:'Filosofia',unidade:'EFG'},
  {dia:3,ini:'08:55',fim:'09:45',serie:1,letra:'A',disc:'História',unidade:'EFG'},
  {dia:3,ini:'09:45',fim:'10:35',serie:3,letra:'A',disc:'Sociologia',unidade:'EFG'},
  {dia:3,ini:'10:45',fim:'11:35',serie:2,letra:'A',disc:'Sociologia',unidade:'EFG'},
  {dia:3,ini:'14:00',fim:'14:50',serie:9,letra:'A',disc:'História',unidade:'CEPI Marajó'},
  {dia:3,ini:'14:50',fim:'15:40',serie:9,letra:'A',disc:'História',unidade:'CEPI Marajó'},
  {dia:3,ini:'15:40',fim:'16:30',serie:9,letra:'C',disc:'História',unidade:'CEPI Marajó'},
  {dia:3,ini:'16:30',fim:'17:15',serie:9,letra:'C',disc:'História',unidade:'CEPI Marajó'},
  {dia:3,ini:'17:15',fim:'18:00',serie:9,letra:'C',disc:'História',unidade:'CEPI Marajó'},
  // Quinta — EFG
  {dia:4,ini:'08:55',fim:'09:45',serie:2,letra:'B',disc:'Filosofia',unidade:'EFG'},
  {dia:4,ini:'09:45',fim:'10:35',serie:3,letra:'B',disc:'Filosofia',unidade:'EFG'},
  {dia:4,ini:'10:45',fim:'11:35',serie:2,letra:'A',disc:'Filosofia',unidade:'EFG'},
  {dia:4,ini:'11:35',fim:'12:25',serie:1,letra:'B',disc:'Filosofia',unidade:'EFG'},
  {dia:4,ini:'12:25',fim:'13:15',serie:1,letra:'A',disc:'Sociologia',unidade:'EFG'},
  // Sexta — EFG
  {dia:5,ini:'07:15',fim:'08:05',serie:1,letra:'A',disc:'Filosofia',unidade:'EFG'},
  {dia:5,ini:'08:05',fim:'08:55',serie:3,letra:'B',disc:'Sociologia',unidade:'EFG'},
  {dia:5,ini:'09:45',fim:'10:35',serie:3,letra:'C',disc:'Sociologia',unidade:'EFG'},
  {dia:5,ini:'10:45',fim:'11:35',serie:3,letra:'C',disc:'Filosofia',unidade:'EFG'},
  {dia:5,ini:'12:25',fim:'13:15',serie:1,letra:'B',disc:'Sociologia',unidade:'EFG'},
];

function gradeAtual(t) {
  if (!t || !t.serie || !t.disciplina) return t && t.grade || null;
  const serieNum = parseInt(t.serie, 10);
  const entradas = SCHEDULE.filter((x) => x.serie === serieNum && x.letra === (t.letra || '') && x.disc === t.disciplina && x.unidade === (t.unidade || ''));
  if (entradas.length) {
    const grade = {};
    entradas.forEach((x) => { grade[x.dia] = (grade[x.dia] || 0) + 1; });
    return grade;
  }
  return t.grade || null;
}

async function importarPlanilhaArlan() {
  const [freqCsv, ocorCsv] = await Promise.all([
    fetch(urlAba('Frequencia_Diaria')).then((r) => r.text()),
    fetch(urlAba('Ocorrencias')).then((r) => r.text()),
  ]);
  const faltas = csvParaObjetos(freqCsv).filter((r) => r.Status === 'Falta' && r.data && r.Turma);
  const ocorrencias = csvParaObjetos(ocorCsv).filter((r) => r.Nome_Aluno && r.Data && r.Turma);

  const [turmasSnap, alunosSnap, chamadasSnap, logSnap] = await Promise.all([
    rtdb.ref('leciona/turmas').once('value'),
    rtdb.ref('leciona/alunos').once('value'),
    rtdb.ref('leciona/chamadas').once('value'),
    rtdb.ref('leciona/_importLog').once('value'),
  ]);
  const turmas = turmasSnap.val() || {};
  const alunos = alunosSnap.val() || {};
  const chamadas = chamadasSnap.val() || {};
  const log = logSnap.val() || {};
  const logChamadas = log.chamadas || {};
  const logQualitativa = log.qualitativa || {};

  const gradePorTurma = {}; // tid -> grade atual (SCHEDULE tem prioridade sobre t.grade)
  const codigoMap = {}; // "1A" etc -> [{tid,disciplina,grade}]
  Object.keys(turmas).forEach((tid) => {
    const t = turmas[tid];
    if (t.unidade !== 'EFG' || t.ativo === false || !t.serie || !t.letra) return;
    const grade = gradeAtual(t);
    if (!grade) return;
    gradePorTurma[tid] = grade;
    const codigo = t.serie[0] + t.letra;
    (codigoMap[codigo] = codigoMap[codigo] || []).push({ tid, disciplina: t.disciplina, grade });
  });
  const rosterPorTurma = {}; // tid -> [{aid,nome,tokens}]
  Object.keys(alunos).forEach((aid) => {
    const a = alunos[aid];
    if (!a.turmaId) return;
    (rosterPorTurma[a.turmaId] = rosterPorTurma[a.turmaId] || []).push({ aid, nome: a.nome, tokens: tokensRelevantes(a.nome) });
  });
  const chamadasExistentes = new Set(Object.values(chamadas).map((c) => c.turmaId + '|' + c.data));

  const updates = {};
  const pendencias = [];
  let chamadasCriadas = 0, faltasGravadas = 0, qualitativaCriada = 0, alunosAdicionados = 0;

  /* Alunos que a planilha do Arlan cita mas que ainda não existiam no
     Leciona pra nenhuma disciplina daquela turma (revisado manualmente —
     não é pra virar lista de "criar sempre que não achar", só os casos
     já confirmados como aluno novo de verdade, não erro de digitação nem
     nome ambíguo). Cadastra em TODAS as turmas-disciplina do código, do
     mesmo jeito que os demais alunos da turma, e já entra no roster desta
     mesma rodada — então uma falta/ocorrência dele já registrada nesta
     janela de datas casa direto, sem precisar rodar de novo. */
  const ALUNOS_NOVOS_CONFIRMADOS = [
    { nome: 'Lucas Oliveira Rangel de Jesus', codigo: '2B' },
    { nome: 'Caroline Oliveira Rangel de Jesus', codigo: '3A' },
  ];
  ALUNOS_NOVOS_CONFIRMADOS.forEach(({ nome, codigo }) => {
    (codigoMap[codigo] || []).forEach(({ tid }) => {
      const roster = rosterPorTurma[tid] || (rosterPorTurma[tid] = []);
      const jaExiste = encontrarAluno(nome, roster).status === 'ok';
      if (jaExiste) return;
      const aid = rtdb.ref('leciona/alunos').push().key;
      updates['leciona/alunos/' + aid] = { id: aid, nome, turmaId: tid, ativo: true, _importadoPlanilha: true };
      roster.push({ aid, nome, tokens: tokensRelevantes(nome) });
      alunosAdicionados++;
    });
  });

  /* Ocorrências que ficaram pendentes por nome ambíguo (2+ alunos reais
     batendo) e foram resolvidas manualmente com a professora — mesmo
     esquema de idempotência do resto (_importLog), só que com uma chave
     própria em vez do ID_Registro da planilha. */
  const OCORRENCIAS_CONFIRMADAS_MANUALMENTE = [
    { nome: 'Davi Araújo Ribeiro Moura', codigo: '3C', data: '2026-08-03', tipo: 'Uso indevido de celular / eletrônicos' },
  ];
  OCORRENCIAS_CONFIRMADAS_MANUALMENTE.forEach(({ nome, codigo, data, tipo }) => {
    const motivoKey = MOTIVO_MAP_OCORRENCIA[tipo] || 'outro';
    (codigoMap[codigo] || []).forEach(({ tid }) => {
      const chaveLog = 'manual_' + normNome(nome) + '_' + data + '_' + tid;
      if (logQualitativa[chaveLog]) return;
      updates['leciona/_importLog/qualitativa/' + chaveLog] = true;
      const res = encontrarAluno(nome, rosterPorTurma[tid] || []);
      if (res.status !== 'ok') return;
      const qid = rtdb.ref('leciona/qualitativa').push().key;
      updates['leciona/qualitativa/' + qid] = {
        id: qid, alunoId: res.aid, turmaId: tid, data, motivoKey,
        motivo: MOTIVO_LABEL[motivoKey] + ' — ' + tipo, valor: -0.1, _ts: Date.now(), _importadoPlanilha: true,
      };
      qualitativaCriada++;
    });
  });

  /* Autocorreção: se o SCHEDULE mudou desde a última importação, uma chamada
     que a gente criou antes pode estar num dia que a turma não tem mais aula
     (ou vice-versa). Remove as que ficaram órfãs — só as marcadas
     _importadoPlanilha, nunca uma chamada feita na hora pela professora —
     e libera o log delas pra recriar certo no passo seguinte. */
  let chamadasCorrigidas = 0;
  Object.entries(chamadas).forEach(([cid, c]) => {
    if (!c || !c._importadoPlanilha || !c.turmaId || !c.data) return;
    const grade = gradePorTurma[c.turmaId];
    const wd = new Date(c.data + 'T00:00:00').getDay();
    if (grade && temAula(grade, wd)) return; // ainda bate com o horário atual, mantém
    updates['leciona/chamadas/' + cid] = null;
    updates['leciona/_importLog/chamadas/' + c.turmaId + '_' + c.data] = null;
    delete logChamadas[c.turmaId + '_' + c.data];
    chamadasExistentes.delete(c.turmaId + '|' + c.data);
    chamadasCorrigidas++;
  });

  const faltasPorDiaTurma = {}; // "codigo|iso" -> [nomes]
  let maxData = IMPORT_START_DATE;
  faltas.forEach((r) => {
    const iso = isoDeDataBr(r.data);
    if (!iso) return;
    if (iso > maxData) maxData = iso;
    const chave = r.Turma + '|' + iso;
    (faltasPorDiaTurma[chave] = faltasPorDiaTurma[chave] || []).push(r.Nome_Aluno);
  });

  const cursor = new Date(IMPORT_START_DATE + 'T00:00:00');
  const fim = new Date(maxData + 'T00:00:00');
  while (cursor <= fim) {
    const iso = cursor.toISOString().slice(0, 10);
    const wd = cursor.getDay();
    Object.keys(codigoMap).forEach((codigo) => {
      codigoMap[codigo].forEach(({ tid, disciplina, grade }) => {
        if (!temAula(grade, wd)) return;
        const chaveLog = tid + '_' + iso;
        if (chamadasExistentes.has(tid + '|' + iso) || logChamadas[chaveLog]) return;
        const nomes = faltasPorDiaTurma[codigo + '|' + iso] || [];
        const roster = rosterPorTurma[tid] || [];
        const presencas = {};
        nomes.forEach((nome) => {
          const res = encontrarAluno(nome, roster);
          if (res.status === 'ok') presencas[res.aid] = false;
          else pendencias.push({ tipo: 'falta', nome, codigo, disciplina, turmaId: tid, data: iso, candidatos: res.candidatos || [] });
        });
        const cid = rtdb.ref('leciona/chamadas').push().key;
        updates['leciona/chamadas/' + cid] = { id: cid, turmaId: tid, data: iso, presencas, _ts: Date.now(), _importadoPlanilha: true };
        updates['leciona/_importLog/chamadas/' + chaveLog] = true;
        chamadasCriadas++;
        faltasGravadas += Object.keys(presencas).length;
      });
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  ocorrencias.forEach((r) => {
    const rid = (r.ID_Registro || '').trim();
    const codigo = (r.Turma || '').trim();
    const iso = isoDeDataBr(r.Data);
    const tipo = (r.Tipo_Ocorrencia || '').trim();
    if (!rid || !iso) return;
    const motivoKey = MOTIVO_MAP_OCORRENCIA[tipo] || 'outro';
    (codigoMap[codigo] || []).forEach(({ tid, disciplina }) => {
      const chaveLog = rid + '_' + tid;
      if (logQualitativa[chaveLog]) return;
      updates['leciona/_importLog/qualitativa/' + chaveLog] = true;
      const res = encontrarAluno(r.Nome_Aluno, rosterPorTurma[tid] || []);
      if (res.status === 'ok') {
        const qid = rtdb.ref('leciona/qualitativa').push().key;
        updates['leciona/qualitativa/' + qid] = {
          id: qid, alunoId: res.aid, turmaId: tid, data: iso, motivoKey,
          motivo: MOTIVO_LABEL[motivoKey] + ' — ' + tipo, valor: -0.1, _ts: Date.now(), _importadoPlanilha: true,
        };
        qualitativaCriada++;
      } else {
        pendencias.push({ tipo: 'ocorrencia', nome: r.Nome_Aluno, codigo, disciplina, data: iso, motivo: tipo, candidatos: res.candidatos || [] });
      }
    });
  });

  pendencias.forEach((p) => {
    const pid = rtdb.ref('leciona/_importPendencias').push().key;
    updates['leciona/_importPendencias/' + pid] = Object.assign({ id: pid, criadoEm: Date.now() }, p);
  });

  if (Object.keys(updates).length) await rtdb.ref().update(updates);
  return { chamadasCriadas, faltasGravadas, qualitativaCriada, chamadasCorrigidas, alunosAdicionados, pendencias: pendencias.length };
}

/* Correção pontual de campos — usada quando um dado no Firebase está errado
   (ex.: código DC-GO de um tema não bate com o assunto real) e a escrita
   direta via CLI não está confiável. Só aceita caminhos dentro de
   "leciona/", nunca a raiz nem outro nó do projeto. request.data:
   { correcoes: [{ path: 'temas/<id>/dcgo', valor: '...' }, ...] } */
exports.corrigirCampos = onCall(
  { region: 'southamerica-east1', timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);
    const correcoes = (request.data || {}).correcoes;
    if (!Array.isArray(correcoes) || !correcoes.length) {
      throw new HttpsError('invalid-argument', 'Envie { correcoes: [{path, valor}, ...] }.');
    }
    const updates = {};
    correcoes.forEach(({ path, valor }) => {
      if (typeof path !== 'string' || !path.startsWith('leciona/')) {
        throw new HttpsError('invalid-argument', 'Caminho inválido (precisa começar com "leciona/"): ' + path);
      }
      updates[path] = valor;
    });
    await rtdb.ref().update(updates);
    return { aplicadas: Object.keys(updates).length };
  }
);

exports.importarPlanilhaAgora = onCall(
  { region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);
    try {
      return await importarPlanilhaArlan();
    } catch (e) {
      throw new HttpsError('internal', 'Erro ao importar planilha: ' + (e.message || String(e)));
    }
  }
);

// Roda sozinha todo dia útil à noite, depois que a planilha do Arlan já foi preenchida.
exports.importarPlanilhaAgendado = onSchedule(
  { schedule: '30 19 * * 1-5', timeZone: 'America/Sao_Paulo', region: 'southamerica-east1', memory: '256MiB', timeoutSeconds: 120 },
  async () => { await importarPlanilhaArlan(); }
);

/* Endpoint HTTP (chave compartilhada, sem precisar de login) pra disparar a
   importação de fora do app — ex.: de um terminal ou de uma sessão do Claude
   Code. Desativado por ora: precisa de "firebase functions:secrets:set
   IMPORT_SECRET" rodado manualmente (fora do Claude Code) antes do deploy —
   é uma ação que grava segredo de produção, então o modo automático não
   deixa a própria IA fazer isso sozinha. Pra habilitar: rode o comando
   acima com uma chave forte, descomente o bloco abaixo e faça deploy nesta
   function; depois é só "curl -H 'x-import-key: SUA_CHAVE' <url-da-function>".
if (false) exports.importarPlanilhaHttp = onRequest(
  { secrets: [IMPORT_SECRET], region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (req, res) => {
    if (req.get('x-import-key') !== IMPORT_SECRET.value()) {
      res.status(403).json({ erro: 'chave inválida' });
      return;
    }
    try {
      res.json(await importarPlanilhaArlan());
    } catch (e) {
      res.status(500).json({ erro: e.message || String(e) });
    }
  }
);
*/

/* Único endpoint pra todo uso de IA do Leciona (substitui os antigos
   callClaude/callClaudeWeb/callClaudeChat do cliente, que faziam fetch
   direto com a chave exposta no navegador).
   request.data: { system, messages:[{role,content}], maxTokens?, useWeb?, model?, tools? }
   retorno: { resposta: string, content: Block[], stop_reason: string }

   O parâmetro `tools` é opcional e passa direto pra API da Anthropic sem
   nenhum conhecimento do que cada ferramenta faz — de propósito: assim
   como o resto do Leciona, TODA a lógica de negócio (o que uma ferramenta
   faz de fato: criar compromisso, consultar agenda etc.) mora no cliente,
   nunca aqui. Esta função continua sendo só um proxy burro da API, agora
   também pra respostas com tool_use — quem decide o que fazer com uma
   chamada de ferramenta e quem chama esta função de novo pra continuar o
   loop é o index.html (ver assistenteLoop() / FERRAMENTAS_ASSISTENTE). */
exports.gerarComIA = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);

    const { system, messages, maxTokens, useWeb, model, tools } = request.data || {};
    if (!system || !Array.isArray(messages) || !messages.length) {
      throw new HttpsError('invalid-argument', 'Requisição incompleta: faltam "system" ou "messages".');
    }

    const body = {
      model: model || 'claude-sonnet-4-6',
      max_tokens: maxTokens || 2500,
      system,
      messages,
    };
    const toolList = Array.isArray(tools) ? tools.slice() : [];
    if (useWeb) {
      toolList.push({ type: 'web_search_20250305', name: 'web_search', max_uses: 3 });
    }
    if (toolList.length) {
      body.tools = toolList;
    }

    const key = ANTHROPIC_API_KEY.value();
    let ultimoErro = null;

    for (let tentativa = 0; tentativa <= 2; tentativa++) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
        });

        if (res.status === 429 && tentativa < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (tentativa + 1)));
          continue;
        }
        if (!res.ok) {
          const texto = await res.text();
          throw new Error('API ' + res.status + ': ' + texto.slice(0, 200));
        }

        const data = await res.json();
        const resposta = (data.content || [])
          .map((b) => (b.type === 'text' ? b.text || '' : ''))
          .join('\n')
          .trim();
        return { resposta, content: data.content || [], stop_reason: data.stop_reason || null };
      } catch (e) {
        ultimoErro = e;
        if (tentativa < 2 && /429|rate.limit|timeout/i.test(e.message || '')) {
          await new Promise((r) => setTimeout(r, 1500 * (tentativa + 1)));
          continue;
        }
        throw new HttpsError('internal', 'Erro ao consultar a IA: ' + (e.message || String(e)));
      }
    }

    throw new HttpsError('internal', 'Erro ao consultar a IA: ' + (ultimoErro && ultimoErro.message));
  }
);

/* =========================================================
   Sincroniza a nota qualitativa do 9ºA/9ºC (História, CEPI Marajó) com a
   planilha compartilhada da escola. Roda toda sexta às 20h, ou sob demanda
   pelo botão em Configurações. Escreve só a coluna HIST — nunca mexe em
   nenhuma outra coluna/disciplina da planilha (compartilhada com outros
   professores). Valor da célula é o total acumulado de descontos no
   bimestre, não incremental — idempotente, seguro rodar de novo quantas
   vezes for. A justificativa de cada desconto vai como NOTA da célula
   (não aparece no valor, não bagunça o visual), substituída por inteiro
   a cada rodada — sempre a lista completa e atual, nunca duplica. */
const PLANILHA_QUALITATIVA_ID = '1SIBQEXhu_aprqQ4r8P5TaJtpr_W2Z-fV';
const TURMAS_QUALITATIVA_PLANILHA = [
  { turmaId: '7c45d998-44a9-421c-ac38-9b5437f3a4e7', aba: '9A' },
  { turmaId: 'bdf35d81-b0c2-4fa9-9f3f-d744932850fe', aba: '9C' },
];

async function sheetsClient() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function atualizarQualitativaNaPlanilha() {
  const sheets = await sheetsClient();
  const [alunosSnap, qualSnap] = await Promise.all([
    rtdb.ref('leciona/alunos').once('value'),
    rtdb.ref('leciona/qualitativa').once('value'),
  ]);
  const alunos = alunosSnap.val() || {};
  const qualitativa = qualSnap.val() || {};

  const meta = await sheets.spreadsheets.get({ spreadsheetId: PLANILHA_QUALITATIVA_ID });
  const sheetIdPorAba = {};
  (meta.data.sheets || []).forEach((s) => { sheetIdPorAba[s.properties.title] = s.properties.sheetId; });

  let celulasAtualizadas = 0;
  const semMatch = [];

  for (const { turmaId, aba } of TURMAS_QUALITATIVA_PLANILHA) {
    const sheetId = sheetIdPorAba[aba];
    if (sheetId == null) { semMatch.push({ aba, erro: 'aba não encontrada na planilha' }); continue; }

    const roster = Object.entries(alunos)
      .filter(([, a]) => a && a.turmaId === turmaId)
      .map(([aid, a]) => ({ aid, nome: a.nome, tokens: tokensRelevantes(a.nome) }));

    const porAluno = {};
    Object.values(qualitativa).forEach((q) => {
      if (!q || q.turmaId !== turmaId) return;
      (porAluno[q.alunoId] = porAluno[q.alunoId] || []).push(q);
    });

    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: PLANILHA_QUALITATIVA_ID, range: "'" + aba + "'!A1:N200" });
    const linhas = resp.data.values || [];
    const headerRow = linhas[0] || [];
    const colHist = headerRow.findIndex((h) => (h || '').trim().toUpperCase() === 'HIST');
    if (colHist < 0) { semMatch.push({ aba, erro: 'coluna HIST não encontrada' }); continue; }

    const requests = [];
    for (let i = 1; i < linhas.length; i++) {
      const nomePlanilha = (linhas[i][1] || '').trim();
      if (!nomePlanilha) continue;
      const res = encontrarAluno(nomePlanilha, roster);
      if (res.status !== 'ok') { semMatch.push({ aba, nomePlanilha, status: res.status }); continue; }
      const eventos = (porAluno[res.aid] || []).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
      if (!eventos.length) continue;
      const total = Math.round(eventos.reduce((s, q) => s + (q.valor || 0), 0) * 10) / 10;
      const nota = eventos.map((q) => (q.data ? q.data.split('-').reverse().join('/') + ' — ' : '') + (q.motivo || '')).join('\n');
      requests.push({
        updateCells: {
          range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: colHist, endColumnIndex: colHist + 1 },
          rows: [{ values: [{ userEnteredValue: { numberValue: total }, note: nota }] }],
          fields: 'userEnteredValue,note',
        },
      });
      celulasAtualizadas++;
    }
    if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId: PLANILHA_QUALITATIVA_ID, requestBody: { requests } });
  }

  return { celulasAtualizadas, semMatch };
}

exports.atualizarQualitativaPlanilhaAgora = onCall(
  { region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);
    try {
      return await atualizarQualitativaNaPlanilha();
    } catch (e) {
      throw new HttpsError('internal', 'Erro ao atualizar planilha: ' + (e.message || String(e)));
    }
  }
);

// Roda sozinha toda sexta-feira às 20h.
exports.atualizarQualitativaPlanilhaAgendado = onSchedule(
  { schedule: '0 20 * * 5', timeZone: 'America/Sao_Paulo', region: 'southamerica-east1', memory: '256MiB', timeoutSeconds: 120 },
  async () => { await atualizarQualitativaNaPlanilha(); }
);
