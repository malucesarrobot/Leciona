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

function isoDeDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function segundaDaSemana(dataISO) {
  const d = new Date(dataISO + 'T00:00:00');
  const diaAtual = d.getDay();
  d.setDate(d.getDate() - ((diaAtual + 6) % 7));
  return isoDeDate(d);
}
function dataDoDiaNaSemana(segundaISO, diaOficial) {
  const d = new Date(segundaISO + 'T00:00:00');
  d.setDate(d.getDate() + ((Number(diaOficial) + 6) % 7));
  return isoDeDate(d);
}
/* Dias de aula/semana da grade, em ordem (ex.: [2,4] = terça e quinta). */
function diasOficiaisDaGrade(grade) {
  if (!grade) return [];
  const dias = Array.isArray(grade)
    ? grade.map((n, i) => (n ? i : null)).filter((v) => v != null)
    : Object.keys(grade).filter((k) => grade[k]).map(Number);
  return dias.sort((a, b) => a - b);
}

/* =========================================================
   Backfill: registra como "aplicado" (cria um `registro`, igual ao botão
   "✓ Registrar" da própria tela) todo tema do cronograma cuja data já
   passou. No Médio (EFG, 1 aula/semana) e no Fundamental (CEPI Marajó, 3
   aulas/semana), as entradas de cronograma de cada semana são redistribuídas
   pelos dias oficiais daquela semana, na ordem em que aparecem no
   cronograma — corrige datas de horário provisório sem mudar a
   semana/sequência. Confirmado com a professora: o "quando" exato não
   importa, o registro oficial entra no dia do horário atual. Fora dessas
   duas unidades (Eletiva, Estudo Orientado), mantém o critério estrito: só
   registra se a data já bater com a grade, senão vira pendência.
   Idempotente — não duplica registro pra um tema+turma+data que já tem um.
   Só o 3º Bimestre (em andamento). */
async function registrarAulasPassadas() {
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [turmasSnap, contSnap, temasSnap, regSnap] = await Promise.all([
    rtdb.ref('leciona/turmas').once('value'),
    rtdb.ref('leciona/conteudos').once('value'),
    rtdb.ref('leciona/temas').once('value'),
    rtdb.ref('leciona/registros').once('value'),
  ]);
  const turmas = turmasSnap.val() || {};
  const conteudos = contSnap.val() || {};
  const temasAll = temasSnap.val() || {};
  const registros = regSnap.val() || {};

  const existentes = new Set(Object.values(registros).map((r) => r.temaId + '|' + r.turmaId + '|' + r.data));

  const updates = {};
  let criados = 0, datasCorrigidas = 0;
  const pendencias = [];

  Object.values(conteudos).forEach((c) => {
    if (!c || !c.turmaId || c.bimestre !== '3º Bimestre' || !Array.isArray(c.planejamento)) return;
    const turma = turmas[c.turmaId];
    if (!turma || turma.ativo === false) return;
    const grade = gradeAtual(turma);
    const redistribui = turma.unidade === 'EFG' || turma.unidade === 'CEPI Marajó';
    const diasOficiais = redistribui ? diasOficiaisDaGrade(grade) : [];

    // datas finais calculadas pra cada entrada desta turma-conteúdo, antes de gravar
    const finais = c.planejamento.map((p) => ({ p, dataFinal: p && p.data }));

    if (diasOficiais.length) {
      // agrupa por semana (segunda-feira) e redistribui em ordem pelos dias oficiais
      const porSemana = {};
      finais.forEach((f, idx) => {
        if (!f.p || !f.p.data) return;
        const seg = segundaDaSemana(f.p.data);
        (porSemana[seg] = porSemana[seg] || []).push(idx);
      });
      Object.values(porSemana).forEach((idxs) => {
        idxs.forEach((idx, pos) => {
          const seg = segundaDaSemana(finais[idx].p.data);
          const diaAlvo = diasOficiais[pos % diasOficiais.length];
          finais[idx].dataFinal = dataDoDiaNaSemana(seg, diaAlvo);
        });
      });
    }

    finais.forEach(({ p, dataFinal }, idx) => {
      if (!p || !p.data || !p.temaId) return;
      const tema = temasAll[p.temaId];
      if (!tema) return;

      if (!diasOficiais.length) {
        // sem redistribuição: exige que a data original já bata com a grade
        const wd0 = new Date(p.data + 'T00:00:00').getDay();
        if (!grade || !temAula(grade, wd0)) {
          pendencias.push({ turma: (turma.nome || '') + ' ' + (turma.disciplina || ''), data: p.data, tema: tema.nome });
          return;
        }
        dataFinal = p.data;
      }

      if (dataFinal !== p.data) {
        updates['leciona/conteudos/' + c.id + '/planejamento/' + idx + '/data'] = dataFinal;
        datasCorrigidas++;
      }
      if (dataFinal > hoje) return; // corrigida mas ainda no futuro — próxima rodada registra
      const chave = p.temaId + '|' + c.turmaId + '|' + dataFinal;
      if (existentes.has(chave)) return;
      const rid = rtdb.ref('leciona/registros').push().key;
      updates['leciona/registros/' + rid] = {
        id: rid, temaId: p.temaId, turmaId: c.turmaId, data: dataFinal,
        objetos: ['quadro'], entrega: 'sala',
        nota: 'Lançado automaticamente a partir do cronograma e do horário (backfill 18/08/2026).' + (dataFinal !== p.data ? ' Data corrigida de ' + p.data.split('-').reverse().join('/') + ' pro dia oficial da semana.' : ''),
        _ts: Date.now(), _importadoAutomatico: true,
      };
      existentes.add(chave);
      criados++;
    });
  });

  if (Object.keys(updates).length) await rtdb.ref().update(updates);
  return { criados, datasCorrigidas, pendencias: pendencias.length, detalhePendencias: pendencias.slice(0, 40) };
}

exports.registrarAulasPassadasAgora = onCall(
  { region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);
    try {
      return await registrarAulasPassadas();
    } catch (e) {
      throw new HttpsError('internal', 'Erro ao registrar aulas: ' + (e.message || String(e)));
    }
  }
);

/* =========================================================
   Correção pontual: apaga turmas obsoletas e tudo vinculado a elas
   (alunos, conteúdos, temas, registros, qualitativa, chamadas) — a turma
   "Geral" auto-criada sem aluno nenhum, a "Eletiva" do CEPI Marajó (sem
   aluno) e as 6 turmas de Filosofia do CEPI Marajó marcadas inativas que a
   professora confirmou não ter mais, mesmo as com histórico de registro/
   qualitativa. Decidido em 18/08/2026. */
const TURMAS_A_EXCLUIR = [
  '4a2bb7d3-490f-443b-a335-0f347e21cfee', // EFG "Geral — 1ª série EM" Sociologia (_auto)
  '3ef008db-ab56-4673-ad58-369f31ffb062', // CEPI Marajó Eletiva
  '4dea8eb4-443b-4f5d-b97f-feb344c2b59b', // CEPI Marajó 1ªA Filosofia
  'd43118fe-7685-4006-b363-3252b9693808', // CEPI Marajó 1ªB Filosofia
  'a4553570-4da8-487b-9f90-658860759e84', // CEPI Marajó 1ªC Filosofia
  'a020078d-16d4-4a9b-8fc3-c516e6a918d5', // CEPI Marajó 1ªD Filosofia
  'bf3c63d6-c619-41ec-bf4a-f2ffc6d2c710', // CEPI Marajó 3ªA Filosofia
  '46dde117-3d67-4c46-b91b-f5acc4d57a29', // CEPI Marajó 3ªB Filosofia
];

exports.excluirTurmasObsoletasAgora = onCall(
  { region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);
    const idsAlvo = new Set(TURMAS_A_EXCLUIR);
    const nos = ['alunos', 'conteudos', 'temas', 'registros', 'qualitativa', 'chamadas'];
    const [turmasSnap, ...outros] = await Promise.all([
      rtdb.ref('leciona/turmas').once('value'),
      ...nos.map((n) => rtdb.ref('leciona/' + n).once('value')),
    ]);
    const turmas = turmasSnap.val() || {};
    const updates = {};
    const removidos = {};

    TURMAS_A_EXCLUIR.forEach((tid) => { updates['leciona/turmas/' + tid] = null; });
    removidos.turmas = TURMAS_A_EXCLUIR.filter((tid) => turmas[tid]).length;

    nos.forEach((n, i) => {
      const dados = outros[i].val() || {};
      let count = 0;
      Object.entries(dados).forEach(([id, item]) => {
        if (item && idsAlvo.has(item.turmaId)) {
          updates['leciona/' + n + '/' + id] = null;
          count++;
        }
      });
      removidos[n] = count;
    });

    if (Object.keys(updates).length) await rtdb.ref().update(updates);
    return removidos;
  }
);


/* =========================================================
   Reconstroi temas orfaos: entradas de leciona/conteudos, campo
   planejamento, cujo temaId nao existe mais em leciona/temas (foram
   apagados em algum momento, sobrando so a data no cronograma). Recria o
   tema (nome, codigo DC-GO, habilidade da matriz oficial, foco como obs)
   usando os dados do "Planejamento Completo" (HTML mandado pela
   professora em 18/08/2026), casando por serie+disciplina+SEMANA (nao
   data exata, ja que datas foram corrigidas depois pelo horario oficial)
   e liga a entrada de volta ao tema novo. So 3 Bimestre. */
const PLANO_COMPLETO_FULL = [
  {serie:'1',disc:'Filosofia',data:'2026-08-07',codigo:'EM13CHS502',nome:'Direitos Humanos e dignidade humana: da desigualdade à ação',foco:'O que são Direitos Humanos: da Declaração de 1948 aos dias de hoje',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'1',disc:'Filosofia',data:'2026-08-14',codigo:'EM13CHS502',nome:'Direitos Humanos e dignidade humana: da desigualdade à ação',foco:'Ações e movimentos que promovem Direitos Humanos (ONGs, coletivos, políticas públicas)',metodologia:'Livro didático (páginas a definir)'},
  {serie:'1',disc:'Filosofia',data:'2026-08-21',codigo:'GO-EMCHS502C',nome:'Liberdade de expressão: filósofos e sofistas no período clássico',foco:'Liberdade de expressão: origem no debate entre sofistas e Sócrates na pólis grega',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'1',disc:'Filosofia',data:'2026-08-28',codigo:'GO-EMCHS502C',nome:'Liberdade pública e liberdade privada: a reflexão de Benjamin Constant',foco:'Liberdade dos antigos x liberdade dos modernos: a distinção de Benjamin Constant',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'1',disc:'Filosofia',data:'2026-09-04',codigo:'GO-EMCHS502C',nome:'Liberdade pública e liberdade privada: a reflexão de Benjamin Constant',foco:'Estudo de caso: censura e liberdade de expressão em regimes autoritários',metodologia:'Exibição de filme'},
  {serie:'1',disc:'Filosofia',data:'2026-09-11',codigo:'GO-EMCHS502C',nome:'Liberdade pública e liberdade privada: a reflexão de Benjamin Constant',foco:'Limites da liberdade de expressão: onde termina o direito de opinar?',metodologia:'Pesquisa'},
  {serie:'1',disc:'Filosofia',data:'2026-09-18',codigo:'GO-EMCHS502C',nome:'Liberdade pública e liberdade privada: a reflexão de Benjamin Constant',foco:'Retomada de Direitos Humanos: dignidade, desigualdade e ação concreta',metodologia:'Livro didático (páginas a definir)'},
  {serie:'1',disc:'Filosofia',data:'2026-09-25',codigo:'GO-EMCHS502C',nome:'Liberdade pública e liberdade privada: a reflexão de Benjamin Constant',foco:'Revisão geral: Direitos Humanos, dignidade e liberdade de expressão (mapa mental coletivo)',metodologia:'Revisão em grupo'},
  {serie:'1',disc:'Filosofia',data:'2026-10-02',codigo:'GO-EMCHS502C',nome:'Liberdade pública e liberdade privada: a reflexão de Benjamin Constant',foco:'Recomposição de aprendizagens: atendimento a quem ainda não atingiu os objetivos',metodologia:'Recomposição (atendimento individualizado)'},
  {serie:'1',disc:'História',data:'2026-08-06',codigo:'GO-EMCHS501A',nome:'Grécia Antiga I: a pólis, Atenas e Esparta',foco:'Formação das pólis gregas: Atenas x Esparta e a democracia ateniense',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'1',disc:'História',data:'2026-08-13',codigo:'GO-EMCHS501A',nome:'Grécia Antiga II: filosofia, guerras e legado',foco:'Filosofia grega (Sócrates, Platão, Aristóteles), Guerras Médicas e do Peloponeso, legado grego',metodologia:'Debate'},
  {serie:'1',disc:'História',data:'2026-08-20',codigo:'GO-EMCHS501A',nome:'Roma Antiga I: fundação, monarquia, república e império',foco:'Fundação de Roma: Monarquia, República e Império',metodologia:'Livro didático (páginas a definir)'},
  {serie:'1',disc:'História',data:'2026-08-27',codigo:'GO-EMCHS501A',nome:'Roma Antiga II: expansão, escravidão, queda e direito romano',foco:'Expansão romana, escravidão antiga, queda do Império do Ocidente e Direito Romano',metodologia:'Pesquisa'},
  {serie:'1',disc:'História',data:'2026-09-03',codigo:'GO-EMCHS501A',nome:'Cristianismo e o Fim da Antiguidade',foco:'Surgimento do Cristianismo, perseguições, Edito de Milão e religião oficial do Império',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'1',disc:'História',data:'2026-09-10',codigo:'GO-EMCHS501A',nome:'Povos Bárbaros e a Formação da Europa Medieval',foco:'Povos bárbaros, migrações germânicas e formação dos reinos germânicos',metodologia:'Exibição de filme'},
  {serie:'1',disc:'História',data:'2026-09-17',codigo:'EM13CHS402',nome:'Introdução ao Feudalismo I: origem e sociedade feudal',foco:'Origem do feudalismo, sociedade feudal e relações de suserania e vassalagem',metodologia:'Debate'},
  {serie:'1',disc:'História',data:'2026-09-24',codigo:'EM13CHS402',nome:'Introdução ao Feudalismo II: economia, Igreja e vida cotidiana',foco:'Economia agrária feudal, poder da Igreja Católica e vida cotidiana na Idade Média',metodologia:'Livro didático (páginas a definir)'},
  {serie:'1',disc:'História',data:'2026-10-01',codigo:'EM13CHS402',nome:'Introdução ao Feudalismo II: economia, Igreja e vida cotidiana',foco:'Revisão geral: Grécia, Roma, Cristianismo, Povos Bárbaros e Feudalismo (mapa mental coletivo + resolução de questões) — Recomposição de aprendizagens para quem ainda não atingiu os objetivos',metodologia:'Revisão em grupo'},
  {serie:'1',disc:'Sociologia',data:'2026-08-06',codigo:'GO-EMCHS402A',nome:'O modo de produção capitalista: mercadoria, valor e mais-valia',foco:'SEMANA 1 — Sociologia: O modo de produção capitalista: mercadoria, valor e mais-valia',metodologia:'Livro didático (páginas a definir)'},
  {serie:'1',disc:'Sociologia',data:'2026-08-06',codigo:'GO-EMCHS402B',nome:'Taylorismo e Fordismo',foco:'agrupado nesta aula',metodologia:'Pesquisa'},
  {serie:'1',disc:'Sociologia',data:'2026-08-13',codigo:'GO-EMCHS402C',nome:'Concentração de renda e desigualdade social',foco:'Analisar a concentração de renda como um dos principais fatores de manutenção da desigualdade social no Brasil, comparando indicadores de instituições oficiais.',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'1',disc:'Sociologia',data:'2026-08-20',codigo:'GO-EMCHS402D',nome:'Trabalho rural e urbano',foco:'Pesquisar aspectos do trabalho rural e urbano, comparando características e dados (textos, mapas, gráficos e estatísticas do IBGE) para avaliar as relações de poder no mundo do trabalho.',metodologia:'Exibição de filme'},
  {serie:'1',disc:'Sociologia',data:'2026-08-27',codigo:'GO-EMCHS403A',nome:'Mundo do trabalho contemporâneo',foco:'Compreender as novas formas de trabalho (uberização, plataformização, precarização).',metodologia:'Livro didático (páginas a definir)'},
  {serie:'1',disc:'Sociologia',data:'2026-09-03',codigo:'GO-EMCHS403B',nome:'Tecnologia e empregabilidade',foco:'Compreender os impactos do desenvolvimento tecnológico na organização do mundo do trabalho e na organização espacial, examinando a empregabilidade no contexto das tecnologias e da globalização.',metodologia:'Pesquisa'},
  {serie:'1',disc:'Sociologia',data:'2026-09-10',codigo:'GO-EMCHS403C',nome:'Trabalho intelectual e manual',foco:'Reconhecer as formas de trabalho intelectual e manual, utilizando textos científicos, literários e jornalísticos para analisar as transformações no mundo do trabalho.',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'1',disc:'Sociologia',data:'2026-09-17',codigo:'GO-EMCHS403D',nome:'Reforma trabalhista',foco:'Analisar os principais pontos da reforma trabalhista, contextualizando os novos arranjos possibilitados pela legislação e seu impacto na vida dos/as trabalhadores/as.',metodologia:'Debate'},
  {serie:'1',disc:'Sociologia',data:'2026-09-24',codigo:'GO-EMCHS403D',nome:'Reforma trabalhista',foco:'Revisão geral: capitalismo, mais-valia, taylorismo/fordismo, uberização e desigualdade (mapa mental coletivo)',metodologia:'Revisão em grupo'},
  {serie:'1',disc:'Sociologia',data:'2026-10-01',codigo:'GO-EMCHS403D',nome:'Reforma trabalhista',foco:'Recomposição de aprendizagens e avaliação de fechamento do bimestre',metodologia:'Recomposição (atendimento individualizado)'},
  {serie:'2',disc:'Filosofia',data:'2026-08-07',codigo:'EM13CHS205',nome:'Cultura e poder',foco:'O que é cultura? Popular, erudita e de massa',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'2',disc:'Filosofia',data:'2026-08-14',codigo:'EM13CHS205',nome:'Cultura e poder',foco:'Cultura como campo de disputa e poder (Gramsci e a hegemonia cultural)',metodologia:'Debate'},
  {serie:'2',disc:'Filosofia',data:'2026-08-21',codigo:'EM13CHS205',nome:'Cultura e poder',foco:'Culturas afro-brasileiras e indígenas: resistência e protagonismo cultural',metodologia:'Livro didático (páginas a definir)'},
  {serie:'2',disc:'Filosofia',data:'2026-08-28',codigo:'EM13CHS205',nome:'Cultura e poder',foco:'Quem define o que é "cultura de qualidade"? — Perguntas para o debate: 1) Uma novela ou um funk pode ser "cultura" tanto quanto um livro clássico? 2) Quem decide o que entra no currículo escolar como "cultura importante"? 3) O que se perde quando uma cultura popular (como o samba) vira produto vendável?',metodologia:'Debate'},
  {serie:'2',disc:'Filosofia',data:'2026-09-04',codigo:'GO-EMCHS205D',nome:'Indústria cultural (Escola de Frankfurt)',foco:'Escola de Frankfurt: Adorno, Horkheimer e o conceito de indústria cultural',metodologia:'Exibição de filme'},
  {serie:'2',disc:'Filosofia',data:'2026-09-11',codigo:'GO-EMCHS205D',nome:'Indústria cultural (Escola de Frankfurt)',foco:'Padronização, consumo e alienação: cinema, música e redes sociais hoje',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'2',disc:'Filosofia',data:'2026-09-18',codigo:'GO-EMCHS205D',nome:'Indústria cultural (Escola de Frankfurt)',foco:'Existe resistência possível à indústria cultural?',metodologia:'Debate'},
  {serie:'2',disc:'Filosofia',data:'2026-09-25',codigo:'GO-EMCHS205D',nome:'Cultura de massa: alienação ou empoderamento juvenil?',foco:'Cultura de massa: alienação ou empoderamento juvenil? Debate final antes da revisão',metodologia:'Revisão em grupo'},
  {serie:'2',disc:'Filosofia',data:'2026-10-02',codigo:'GO-EMCHS205D',nome:'Cultura de massa: alienação ou empoderamento juvenil?',foco:'Recomposição de aprendizagens e avaliação de fechamento do bimestre',metodologia:'Recomposição (atendimento individualizado)'},
  {serie:'2',disc:'História',data:'2026-08-06',codigo:'EM13CHS601',nome:'Protagonismos indígenas e afrodescendentes',foco:'Panorama: quem são os protagonistas indígenas e afrodescendentes no Brasil hoje',metodologia:'Debate'},
  {serie:'2',disc:'História',data:'2026-08-13',codigo:'EM13CHS101',nome:'Independência dos Estados Unidos e da América Espanhola',foco:'RECOMPOSIÇÃO (lacuna curricular): Independência dos EUA e da América Espanhola — conteúdo clássico de ENEM',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'2',disc:'História',data:'2026-08-20',codigo:'EM13CHS102',nome:'A Independência do Brasil: da Família Real a D. Pedro I',foco:'RECOMPOSIÇÃO (lacuna curricular): Independência do Brasil — Família Real, Dia do Fico, 7 de Setembro',metodologia:'Debate'},
  {serie:'2',disc:'História',data:'2026-08-27',codigo:'GO-EMCHS601A',nome:'Escravidão e formação do Brasil',foco:'Conhecer as origens históricas da desigualdade étnico-racial desde o período colonial.',metodologia:'Pesquisa'},
  {serie:'2',disc:'História',data:'2026-09-03',codigo:'GO-EMCHS601B',nome:'Resistência indígena e negra',foco:'Compreender as formas de resistência indígena e negra à escravidão.',metodologia:'Exibição de filme'},
  {serie:'2',disc:'História',data:'2026-09-10',codigo:'GO-EMCHS601C',nome:'Exclusão e inclusão precária no Brasil contemporâneo',foco:'Analisar as demandas políticas, sociais e culturais dos povos indígenas e das populações afrodescendentes no Brasil contemporâneo, caracterizando o contexto de exclusão e inclusão precária desses grupos na ordem social e econômica atual.',metodologia:'Debate'},
  {serie:'2',disc:'História',data:'2026-09-17',codigo:'GO-EMCHS601D',nome:'Ações de redução das desigualdades sociais',foco:'Políticas públicas e ações afirmativas de redução da desigualdade',metodologia:'Livro didático (páginas a definir)'},
  {serie:'2',disc:'História',data:'2026-09-24',codigo:'GO-EMCHS601D',nome:'Ações de redução das desigualdades sociais',foco:'Produção dos alunos: proposta de ação/campanha na escola ou comunidade',metodologia:'Pesquisa'},
  {serie:'2',disc:'História',data:'2026-10-01',codigo:'GO-EMCHS601D',nome:'Ações de redução das desigualdades sociais',foco:'Revisão geral: protagonismo indígena e afrodescendente, escravidão, resistência e ações afirmativas (mapa mental coletivo)',metodologia:'Revisão em grupo'},
  {serie:'2',disc:'História',data:'2026-10-08',codigo:'GO-EMCHS601D',nome:'Ações de redução das desigualdades sociais',foco:'Recomposição de aprendizagens e avaliação de fechamento do bimestre',metodologia:'Recomposição (atendimento individualizado)'},
  {serie:'2',disc:'Sociologia',data:'2026-08-06',codigo:'GO-EMCHS205C',nome:'Conflitos sociais no Brasil contemporâneo',foco:'SEMANA 1 — Sociologia: Conflitos sociais no Brasil contemporâneo',metodologia:'Livro didático (páginas a definir)'},
  {serie:'2',disc:'Sociologia',data:'2026-08-13',codigo:'GO-EMCHS205C',nome:'Racismo estrutural e desigualdade social',foco:'Racismo estrutural e desigualdade social: conceito de Silvio Almeida e dados de desigualdade racial no Brasil',metodologia:'Pesquisa'},
  {serie:'2',disc:'Sociologia',data:'2026-08-20',codigo:'GO-EMCHS205C',nome:'Intolerância religiosa e de gênero no Brasil contemporâneo',foco:'Intolerância religiosa contra religiões de matriz africana e intolerância de gênero (LGBTfobia)',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'2',disc:'Sociologia',data:'2026-08-27',codigo:'GO-EMCHS205C',nome:'Movimentos sociais de enfrentamento às intolerâncias',foco:'Movimentos sociais de enfrentamento às intolerâncias: resposta à desigualdade herdada da escravidão',metodologia:'Exibição de filme'},
  {serie:'2',disc:'Sociologia',data:'2026-09-03',codigo:'GO-EMCHS205C',nome:'Movimentos sociais de enfrentamento às intolerâncias',foco:'Conflito social, racismo estrutural, intolerância religiosa e movimentos sociais: como esses temas se conectam? — Perguntas: 1) O racismo estrutural e a intolerância religiosa se combinam na vida de quem sofre os dois ao mesmo tempo? 2) Os movimentos sociais estudados conseguiram mudar leis, mudar mentalidades, ou os dois?',metodologia:'Debate'},
  {serie:'2',disc:'Sociologia',data:'2026-09-10',codigo:'GO-EMCHS205C',nome:'Movimentos sociais de enfrentamento às intolerâncias',foco:'Pesquisa em grupo: um movimento social de enfrentamento à intolerância atuando em Goiás hoje',metodologia:'Pesquisa'},
  {serie:'2',disc:'Sociologia',data:'2026-09-17',codigo:'GO-EMCHS205C',nome:'Movimentos sociais de enfrentamento às intolerâncias',foco:'Apresentação das pesquisas em grupo sobre movimentos sociais locais',metodologia:'Seminário'},
  {serie:'2',disc:'Sociologia',data:'2026-09-24',codigo:'GO-EMCHS205C',nome:'Movimentos sociais de enfrentamento às intolerâncias',foco:'Revisão geral: conflitos sociais, racismo estrutural, intolerância religiosa/gênero e movimentos sociais (mapa mental coletivo)',metodologia:'Revisão em grupo'},
  {serie:'2',disc:'Sociologia',data:'2026-10-01',codigo:'GO-EMCHS205C',nome:'Movimentos sociais de enfrentamento às intolerâncias',foco:'Recomposição de aprendizagens e avaliação de fechamento do bimestre',metodologia:'Recomposição (atendimento individualizado)'},
  {serie:'3',disc:'Filosofia',data:'2026-08-07',codigo:'EM13CHS605',nome:'Princípios dos Direitos Humanos',foco:'A Declaração Universal dos Direitos Humanos (1948): justiça, igualdade, fraternidade',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'Filosofia',data:'2026-08-14',codigo:'EM13CHS605',nome:'Princípios dos Direitos Humanos',foco:'Os 30 artigos da Declaração Universal: pesquisa em grupo, cada grupo apresenta artigos',metodologia:'Pesquisa'},
  {serie:'3',disc:'Filosofia',data:'2026-08-21',codigo:'GO-EMCHS605A',nome:'Direitos naturais (Iluminismo)',foco:'Locke: direitos naturais à vida, liberdade e propriedade — origem do Iluminismo político',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'Filosofia',data:'2026-08-28',codigo:'GO-EMCHS605A',nome:'Direitos naturais (Iluminismo)',foco:'Rousseau: contrato social e a ideia de igualdade',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'Filosofia',data:'2026-09-04',codigo:'GO-EMCHS605A',nome:'Direitos naturais (Iluminismo)',foco:'O Iluminismo criou os Direitos Humanos, ou só deu nome a algo que povos já reivindicavam antes? — trazer exemplos de resistência anterior ao século XVIII',metodologia:'Debate'},
  {serie:'3',disc:'Filosofia',data:'2026-09-11',codigo:'GO-EMCHS605A',nome:'Direitos naturais (Iluminismo)',foco:'Locke: direitos naturais à vida, liberdade e propriedade',metodologia:'Livro didático (páginas a definir)'},
  {serie:'3',disc:'Filosofia',data:'2026-09-18',codigo:'GO-EMCHS605A',nome:'Direitos naturais (Iluminismo)',foco:'Locke e Rousseau: síntese e transição para os progressos e entraves dos Direitos Humanos no século XX',metodologia:'Seminário'},
  {serie:'3',disc:'Filosofia',data:'2026-09-25',codigo:'GO-EMCHS605B',nome:'Direitos Humanos: progressos e entraves',foco:'Progressos: conquistas de direitos no século XX (mulheres, negros, LGBTQIA+)',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'Filosofia',data:'2026-10-02',codigo:'GO-EMCHS605B',nome:'Direitos Humanos: progressos e entraves',foco:'Revisão geral: Direitos Humanos, Iluminismo, progressos e entraves (mapa mental coletivo + resolução de questões)',metodologia:'Revisão em grupo'},
  {serie:'3',disc:'História',data:'2026-08-03',codigo:'GO-EMCHS305A',nome:'Política e meio ambiente no Brasil (pós-Vargas)',foco:'Governos pós-Era Vargas (Dutra, Vargas 2, JK, Jânio, Jango): rupturas e continuidades nas políticas de desenvolvimento',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'História',data:'2026-08-10',codigo:'GO-EMCHS604A',nome:'Segunda Guerra Mundial: totalitarismo, Holocausto e a bomba atômica',foco:'RECOMPOSIÇÃO (2º bimestre): Segunda Guerra Mundial, Holocausto e a bomba atômica sobre Hiroshima e Nagasaki',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'História',data:'2026-08-17',codigo:'GO-EMCHS305A',nome:'Segunda Guerra Mundial: totalitarismo, Holocausto e a bomba atômica',foco:'Governos pós-Vargas: impactos das políticas de desenvolvimento no meio ambiente',metodologia:'Pesquisa'},
  {serie:'3',disc:'História',data:'2026-08-24',codigo:'GO-EMCHS305A',nome:'Segunda Guerra Mundial: totalitarismo, Holocausto e a bomba atômica',foco:'Desenvolvimento a qualquer custo? Grandes obras e seus impactos sociais/ambientais',metodologia:'Debate'},
  {serie:'3',disc:'História',data:'2026-08-31',codigo:'GO-EMCHS605B',nome:'Direitos Humanos e Ditadura Militar',foco:'O golpe de 1964: contexto, justificativas oficiais e primeiros atos institucionais',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'História',data:'2026-09-07',codigo:'GO-EMCHS605B',nome:'Direitos Humanos e Ditadura Militar',foco:'AI-5 (1968) e a institucionalização da repressão: censura, tortura, exílio',metodologia:'Livro didático (páginas a definir)'},
  {serie:'3',disc:'História',data:'2026-09-14',codigo:'GO-EMCHS605B',nome:'Direitos Humanos e Ditadura Militar',foco:'Uma violência desigual: repressão política somada à violência estrutural contra negros e pobres',metodologia:'Pesquisa'},
  {serie:'3',disc:'História',data:'2026-09-21',codigo:'GO-EMCHS605B',nome:'Direitos Humanos e Ditadura Militar',foco:'Resistência possível: UNE, imprensa alternativa, Comunidades Eclesiais de Base',metodologia:'Exibição de filme'},
  {serie:'3',disc:'História',data:'2026-09-28',codigo:'GO-EMCHS605B',nome:'Direitos Humanos e Ditadura Militar',foco:'Anistia de 1979: avanço e ambiguidade (perdão a opositores e a torturadores)',metodologia:'Debate'},
  {serie:'3',disc:'História',data:'2026-10-05',codigo:'GO-EMCHS605B',nome:'Direitos Humanos e Ditadura Militar',foco:'Revisão geral: Segunda Guerra, pós-Vargas, meio ambiente e Ditadura Militar. Recomposição de aprendizagens e avaliação de fechamento do bimestre',metodologia:'Revisão + Recomposição'},
  {serie:'3',disc:'Sociologia',data:'2026-08-03',codigo:'EM13CHS605',nome:'Direitos Humanos no século XXI',foco:'DUDH (1948): origem, princípios e o contexto do pós-guerra/Holocausto',metodologia:'Livro didático (páginas a definir)'},
  {serie:'3',disc:'Sociologia',data:'2026-08-06',codigo:'EM13CHS605',nome:'Direitos Humanos no século XXI',foco:'SEMANA 1 — Sociologia: Direitos Humanos no século XXI',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'Sociologia',data:'2026-08-10',codigo:'EM13CHS605',nome:'Direitos Humanos no século XXI',foco:'Crise migratória global: refugiados e o direito de asilo na prática',metodologia:'Pesquisa'},
  {serie:'3',disc:'Sociologia',data:'2026-08-17',codigo:'EM13CHS605',nome:'Direitos Humanos no século XXI',foco:'Era digital: vigilância, algoritmos e discriminação (reconhecimento facial)',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'Sociologia',data:'2026-08-24',codigo:'GO-EMCHS605B',nome:'Democracia e movimentos sociais',foco:'Democracia representativa x participativa: votar não basta',metodologia:'Exibição de filme'},
  {serie:'3',disc:'Sociologia',data:'2026-08-31',codigo:'GO-EMCHS605B',nome:'Democracia e movimentos sociais',foco:'O que é um movimento social (organização, estratégia, liderança — não "bagunça")',metodologia:'Livro didático (páginas a definir)'},
  {serie:'3',disc:'Sociologia',data:'2026-09-07',codigo:'GO-EMCHS605B',nome:'Democracia e movimentos sociais',foco:'Movimentos sociais mudam mesmo alguma coisa, ou só fazem barulho? — Perguntas: 1) Cite um direito que só existe hoje por causa de um movimento social. 2) Movimentos sociais e partidos políticos disputam ou se complementam?',metodologia:'Debate'},
  {serie:'3',disc:'Sociologia',data:'2026-09-14',codigo:'GO-EMCHS605B',nome:'Democracia e movimentos sociais',foco:'Panorama dos movimentos sociais brasileiros: negro, sindical, feminista, LGBTQIA+, indígena, moradia (MST/MTST)',metodologia:'Pesquisa'},
  {serie:'3',disc:'Sociologia',data:'2026-09-21',codigo:'GO-EMCHS605B',nome:'Democracia e movimentos sociais',foco:'De movimento a lei: Maria da Penha, cotas raciais e o debate do Marco Temporal',metodologia:'Aula expositiva (texto/slide)'},
  {serie:'3',disc:'Sociologia',data:'2026-09-28',codigo:'GO-EMCHS605B',nome:'Democracia e movimentos sociais',foco:'Revisão geral: DUDH, democracia, movimentos sociais e conquistas de direitos (mapa mental coletivo)',metodologia:'Revisão em grupo'},
  {serie:'3',disc:'Sociologia',data:'2026-10-05',codigo:'GO-EMCHS605B',nome:'Democracia e movimentos sociais',foco:'Recomposição de aprendizagens e avaliação de fechamento do bimestre',metodologia:'Recomposição (atendimento individualizado)'},
];
const MATRIZ_HABILIDADE = {
  'História|EF06HI01': 'Reconhecer que a organização do tempo é construída culturalmente, conforme a sociedade e seu contexto histórico.',
  'História|GO-EF06HI02-B': 'Analisar a importância da história oral e dos diferentes tipos de fontes históricas (materiais, escritas, visuais e orais) na produção do saber histórico.',
  'História|GO-EF06HI03-A': 'Identificar as teorias sobre o aparecimento do ser humano no continente africano e os processos de evolução, deslocamento e povoamento a partir da África.',
  'História|EF06HI04': 'Identificar as teorias sobre a origem do homem americano, em especial as dos povos indígenas do Brasil (Serra da Capivara e Lagoa Santa).',
  'História|EF06HI05': 'Identificar as concepções dos povos indígenas originários e africanos sobre a natureza e sua relação com ela.',
  'História|EF06HI07': 'Identificar e analisar as formas de registro histórico e cultural das civilizações da África e do Oriente Médio (hieróglifos, cuneiforme, tradição oral, artefatos).',
  'História|GO-EF06HI07-A': 'Identificar e caracterizar a escrita cuneiforme da Mesopotâmia e sua importância como um dos primeiros sistemas de escrita.',
  'História|GO-EF06HI07-D': 'Investigar os povos do Antigo Oriente (Índia, China, Japão), sua localização e as rotas comerciais de intercâmbio.',
  'História|EF06HI08': 'Identificar os espaços territoriais dos povos originários do continente americano (astecas, maias e incas).',
  'História|GO-EF06HI10-B': 'Compreender as cidades-estado gregas e a democracia ateniense e sua influência nas democracias atuais.',
  'História|EF06HI11': 'Analisar a formação de Roma Antiga e as bases da civilização romana.',
  'História|EF06HI12': 'Compreender o conceito de cidadania e as dinâmicas de inclusão e exclusão na Grécia e Roma antigas.',
  'História|GO-EF06HI13-A': 'Investigar a formação e sustentação dos impérios na Antiguidade, incluindo a África antiga.',
  'História|GO-EF06HI14-B': 'Entender o fim do Império Romano e a passagem do mundo antigo ao medieval.',
  'História|GO-EF07HI01-A': 'Conceituar a Modernidade no contexto da formação dos estados nacionais, da expansão marítima e da colonização.',
  'História|GO-EF07HI02-B': 'Reconhecer as formas de organização social, política e econômica dos povos da América, Europa e África e suas lógicas de produção e circulação de mercadorias.',
  'História|GO-EF07HI03-C': 'Relacionar o modo de vida das civilizações Inca, Maia e Asteca com as sociedades europeias (escrita, moeda, tempo, comércio).',
  'História|EF07HI04': 'Compreender o Renascimento e o Humanismo e como influenciaram a transição da mentalidade medieval para a moderna.',
  'História|GO-EF07HI05-B': 'Analisar a Reforma protestante e as relações entre questões religiosas, políticas e econômicas da época.',
  'História|GO-EF07HI06-A': 'Identificar as rotas marítimas europeias dos séculos XV-XVI e as motivações políticas e econômicas das grandes navegações.',
  'História|GO-EF07HI07-B': 'Compreender a relação entre a formação dos Estados nacionais europeus e o mercantilismo na Idade Moderna.',
  'História|GO-EF07HI08-A': 'Analisar a conquista de Astecas, Incas e Maias pelos espanhóis: alianças, conflitos e resistência.',
  'História|GO-EF07HI09-C': 'Reconhecer os impactos da conquista e colonização para as populações nativas.',
  'História|GO-EF07HI12-A': 'Avaliar a diversidade étnico-racial e a formação do povo brasileiro.',
  'História|GO-EF07HI13-A': 'Analisar a política mercantilista e seus impactos na expansão e colonização europeia.',
  'História|EF08HI01': 'Conceituar iluminismo, liberalismo e neoliberalismo, estabelecendo relações com a atualidade.',
  'História|GO-EF08HI02-A': 'Analisar os desdobramentos das revoluções inglesas nas estruturas políticas, sociais e econômicas da sociedade europeia.',
  'História|GO-EF08HI03-A': 'Identificar e compreender os processos de produção da Revolução Industrial e suas relações com as condições de vida e o trabalho.',
  'História|EF08HI04': 'Identificar o contexto da Revolução Francesa e analisar seus impactos nas independências das Américas e nas revoltas do Brasil Colônia.',
  'História|GO-EF08HI05-A': 'Analisar a influência das ideias iluministas e do anticolonialismo nas revoltas da América Portuguesa (Conjurações Mineira, Baiana e Insurreição Pernambucana).',
  'História|GO-EF08HI11-A': 'Analisar e comparar os movimentos e revoltas do século XVIII no Brasil e na América Espanhola: causas, líderes, desfechos e impactos.',
  'História|EF08HI12': 'Analisar as causas da transferência da Corte portuguesa para o Brasil em 1808 e seus impactos sociais, políticos e econômicos.',
  'História|GO-EF08HI14-B': 'Analisar as consequências históricas da colonização e da escravidão sobre populações afrodescendentes e indígenas e as desigualdades estruturais atuais.',
  'História|GO-EF08HI15-A': 'Analisar o contexto do Primeiro Reinado (1822-1831) e a Independência do Brasil.',
  'História|GO-EF08HI16-A': 'Avaliar o Período Regencial e as revoltas provinciais.',
  'História|GO-EF08HI17-A': 'Analisar as estruturas políticas do Segundo Reinado e relações com modelos atuais.',
  'História|GO-EF08HI18-B': 'Reconhecer as consequências da escravidão e o processo de abolição.',
  'História|GO-EF08HI20-A': 'Problematizar as origens históricas do racismo na sociedade brasileira.',
  'História|EF09HI01': 'Reconhecer o contexto histórico que levou à emergência da República no Brasil e a participação da sociedade na mudança de regime.',
  'História|GO-EF09HI03-A': 'Analisar a Lei de Terras de 1850 como marco da exclusão social e racial no Brasil e seus desdobramentos atuais.',
  'História|GO-EF09HI02-A': 'Compreender a estrutura de poder oligárquica (política café com leite), o coronelismo, a urbanização e a marginalização das camadas populares.',
  'História|GO-EF09HI03-C': 'Entender como a abolição não assegurou à população negra acesso a direitos e condições de vida, e as consequências dessa exclusão.',
  'História|GO-EF09HI05-D': 'Compreender a modernização republicana como processo desigual e excludente, analisando os movimentos rurais e urbanos.',
  'História|GO-EF09HI06-A': 'Analisar a ascensão de Getúlio Vargas ao poder, o Estado Novo, a legislação trabalhista e a centralização do poder (1930-1945).',
  'História|GO-EF09HI06-B': 'Analisar os impactos das políticas varguistas em Goiás (mudanças políticas, sociais e econômicas).',
  'História|GO-EF09HI10-A': 'Analisar o imperialismo do fim do século XIX e sua relação com o nacionalismo e a formação de alianças que levaram à Primeira Guerra.',
  'História|GO-EF09HI10-C': 'Compreender o contexto e os impactos da Primeira Guerra Mundial (transformações sociais, políticas, econômicas e territoriais).',
  'História|EF09HI11': 'Identificar os eventos que levaram à Revolução Russa e analisar a implantação da URSS e suas ideologias.',
  'História|EF09HI12': 'Analisar a Crise de 1929 e seus desdobramentos sobre a economia global.',
  'História|GO-EF09HI13-A': 'Conceituar os regimes totalitários e analisar sua relação com a Segunda Guerra Mundial.',
  'História|GO-EF09HI17-A': 'Analisar os governos populistas e desenvolvimentistas (1946-1964) e seus desdobramentos em Goiás.',
  'História|GO-EF09HI19-A': 'Compreender a ruptura democrática, a Ditadura Militar e a reabertura.',
  'História|GO-EF09HI18-A': 'Identificar o processo de ocupação do centro-oeste brasileiro, a construção de Brasília, e analisar os impactos sobre a região.',
  'História|GO-EF09HI19-B': 'Conhecer e analisar as diversas relações de poder e interferências internacionais na situação política e econômica no Brasil, nas décadas de 1960 a 1980.',
  'História|GO-EF09HI19-C': 'Identificar as mudanças sociais, culturais e políticas nos anos de 1960, analisando os elementos de contestação da ordem estabelecida, bem como os processos de resistência durante a ditadura civil-militar.',
  'História|GO-EF09HI21-A': 'Analisar a questão indígena durante a ditadura militar, relacionando a questão da terra, das "grandes obras" e da FUNAI aos movimentos de luta e contestação dos indígenas nesse período e na atualidade.',
  'História|GO-EF09HI21-B': 'Identificar, no contexto da ditadura civil-militar, as manifestações de racismo, repressão, perseguição e discriminação aos grupos negros, na cidade e no campo, e as resistências do movimento negro.',
  'História|GO-EF09HI22-A': 'Problematizar e analisar a política de conciliação por meio da Anistia de 1979, compreendendo questões relacionadas ao tema na atualidade.',
  'História|GO-EF09HI22-B': 'Analisar o contexto sócio-político, econômico e cultural da sociedade goianiense na década de 1980, destacando sua participação na política nacional.',
  'História|GO-EF09HI22-C': 'Conhecer e analisar o acidente com o Césio-137 em Goiânia e sua relação com a promoção da cidadania, com repercussões locais, nacionais e internacionais.',
  'História|GO-EF09HI26-A': 'Conhecer e problematizar as lutas por igualdade de direito de populações marginalizadas, discutindo políticas públicas afirmativas contra todo tipo de violência.',
  'História|GO-EF09HI26-B': 'Analisar e problematizar as lutas e os movimentos da sociedade brasileira contra o feminicídio, o machismo, a homofobia, o racismo e o bullying na contemporaneidade.',
  'História|GO-EF09HI27-A': 'Compreender e problematizar o uso das mídias digitais na contemporaneidade, a partir do conceito de cultura de massas e sua relação com o capitalismo e a lógica consumista.',
  'História|EF09HI21': 'Identificar e relacionar as demandas indígenas e quilombolas como forma de contestação ao modelo desenvolvimentista da ditadura.',
  'História|EF09HI22': 'Discutir o papel da mobilização da sociedade brasileira do final do período ditatorial até a Constituição de 1988.',
  'História|EF09HI23': 'Identificar direitos civis, políticos e sociais expressos na Constituição de 1988 e relacioná-los à noção de cidadania e ao combate ao racismo.',
  'História|EF09HI24': 'Analisar as transformações políticas, econômicas, sociais e culturais de 1989 aos dias atuais, identificando questões prioritárias para a cidadania e os valores democráticos.',
  'História|EF09HI25': 'Relacionar as transformações da sociedade brasileira aos protagonismos da sociedade civil após 1989.',
  'História|EF09HI26': 'Discutir e analisar as causas da violência contra populações marginalizadas, com vistas à tomada de consciência e à construção de uma cultura de paz.',
  'História|EF09HI27': 'Relacionar aspectos das mudanças econômicas, culturais e sociais ocorridas no Brasil a partir da década de 1990 ao papel do País na era da globalização.',
  'História|EF09HI28': 'Identificar e analisar aspectos da Guerra Fria, seus principais conflitos e as tensões geopolíticas entre os blocos liderados por soviéticos e estadunidenses.',
  'História|EF09HI29': 'Descrever e analisar as experiências ditatoriais na América Latina, seus procedimentos e vínculos com o poder, e a atuação de movimentos de contestação.',
  'História|EF09HI30': 'Comparar as características dos regimes ditatoriais latino-americanos, com atenção à censura, opressão e reformas econômicas e sociais.',
  'História|EF09HI31': 'Descrever e avaliar os processos de descolonização na África e na Ásia e relacioná-los ao contexto geral da Guerra Fria.',
  'História|EF09HI32': 'Analisar mudanças e permanências associadas ao processo de globalização, considerando os argumentos dos movimentos críticos às políticas globais.',
  'História|EF09HI33': 'Analisar as transformações nas relações políticas locais e globais geradas pelo desenvolvimento das tecnologias digitais de informação e comunicação.',
  'História|EF09HI34': 'Discutir as motivações da adoção de diferentes políticas econômicas na América Latina, assim como seus impactos sociais nos países da região.',
  'História|EF09HI35': 'Analisar os aspectos relacionados ao fenômeno do terrorismo na contemporaneidade, incluindo os movimentos migratórios e os choques entre diferentes grupos e culturas.',
  'História|EF09HI36': 'Identificar e discutir as diversidades identitárias e seus significados históricos no início do século XXI, combatendo qualquer forma de preconceito e violência.',
  'Filosofia|GO-EMCHS103A': 'Compreender o que é Filosofia, suas origens e características; a passagem do Mito para a Filosofia, o surgimento da Pólis e a diferença entre doxa e episteme.',
  'Filosofia|GO-EMCHS101A': 'Reconhecer os primeiros filósofos (pré-socráticos: Tales, Anaximandro, Heráclito e Parmênides) e suas explicações racionais sobre a origem do universo (arché).',
  'Filosofia|GO-EMCHS102A': 'Compreender as bases do racionalismo (Descartes) e do empirismo (Locke) como as duas grandes correntes da filosofia moderna sobre a origem do conhecimento.',
  'Filosofia|GO-EMCHS501A': 'Compreender a diferença entre Ética e Moral, analisando a ética na filosofia clássica (Sócrates, Platão e Aristóteles) e comparando com o estilo de vida contemporâneo.',
  'Filosofia|EM13CHS502': 'Problematizar formas de desigualdade e identificar ações que promovam os Direitos Humanos.',
  'Filosofia|GO-EMCHS502C': 'Refletir sobre liberdade de expressão: filósofos x sofistas; liberdade pública e privada (Constant).',
  'Filosofia|GO-EMCHS104D': 'Compreender a filosofia política medieval por meio de Santo Agostinho e Santo Tomás de Aquino.',
  'Filosofia|GO-EMCHS106B': 'Compreender as transformações do pensamento político moderno (Maquiavel) e as teorias do absolutismo (Thomas Hobbes).',
  'Filosofia|GO-EMCHS204B': 'Refletir filosoficamente sobre o trabalho e o cuidado como dimensões éticas da vida humana, com atenção à divisão desigual do trabalho de cuidado entre homens e mulheres, e entre grupos raciais.',
  'Filosofia|GO-EMCHS201C': 'Compreender o pensamento iluminista do século XVIII (Locke, Rousseau e Montesquieu) e sua influência nos processos revolucionários.',
  'Filosofia|EM13CHS205': 'Avaliar processos culturais e relações de poder na sociedade contemporânea.',
  'Filosofia|GO-EMCHS205D': 'Conhecer a Escola de Frankfurt e a indústria cultural (Adorno e Horkheimer).',
  'Filosofia|GO-EMCHS603A': 'Compreender o pensamento político de Hannah Arendt (poder e soberania) e as relações de poder a partir de Foucault.',
  'Filosofia|GO-EMCHS604D': 'Compreender o pensamento de Tomás de Aquino e, por Erasmo de Roterdã, a relação entre filosofia humanista e direitos humanos.',
  'Filosofia|EM13CHS605': 'Analisar os princípios da Declaração dos Direitos Humanos (justiça, igualdade, fraternidade).',
  'Filosofia|GO-EMCHS605A': 'Entender as origens iluministas dos Direitos Humanos (Locke e Rousseau).',
  'Filosofia|GO-EMCHS605B': 'Analisar os princípios da Declaração Universal dos Direitos Humanos, identificando progressos e entraves à sua concretização e refletindo sobre as desigualdades sociais no Mundo Contemporâneo.',
  'História|GO-EMCHS103A': 'Compreender o conceito de História e historiografia, tempo histórico e periodização, Patrimônio Histórico e Cultural.',
  'História|GO-EMCHS101A': 'Identificar fontes históricas para compreender a pré-história e o surgimento da espécie humana; analisar as Civilizações do Antigo Oriente e da América pré-colombiana.',
  'História|EM13CHS102': 'Compreender o Renascimento cultural e o Humanismo europeu, identificando rupturas e continuidades com o mundo medieval e suas conexões com a expansão marítima.',
  'História|GO-EMCHS501A': 'Identificar a Grécia e Roma Antiga (democracia ateniense e direito romano) e analisar a construção da cidadania na Antiguidade Clássica.',
  'História|EM13CHS104': 'Analisar objetos e vestígios da cultura material e imaterial de diferentes sociedades.',
  'História|EM13CHS402': 'Analisar as relações sociais e produtivas do mundo feudal (suserania e vassalagem).',
  'História|GO-EMCHS104D': 'Entender as Cruzadas e o Renascimento urbano e comercial; analisar a crise do sistema feudal.',
  'História|GO-EMCHS106B': 'Compreender a formação do Estado Nacional Moderno, as Grandes Navegações e as práticas mercantilistas.',
  'História|GO-EMCHS201D': 'Compreender os processos sociais, econômicos e políticos relacionados à Revolução Francesa.',
  'História|GO-EMCHS201A': 'Compreender a transição para o capitalismo, as migrações a partir da Revolução Industrial e seus impactos sociais.',
  'História|EM13CHS601': 'Identificar protagonismos de povos indígenas e afrodescendentes no Brasil contemporâneo.',
  'História|GO-EMCHS601A': 'Conhecer as origens históricas da desigualdade étnico-racial desde o período colonial.',
  'História|GO-EMCHS601B': 'Compreender as formas de resistência indígena e negra à escravidão.',
  'História|GO-EMCHS601C': 'Analisar as demandas políticas, sociais e culturais dos povos indígenas e das populações afrodescendentes no Brasil contemporâneo, caracterizando o contexto de exclusão e inclusão precária desses grupos na ordem social e econômica atual.',
  'História|GO-EMCHS601D': 'Pesquisar as demandas e protagonismos políticos, sociais e culturais dos povos indígenas e das populações afrodescendentes no Brasil contemporâneo, promovendo ações de redução das desigualdades sociais.',
  'História|GO-EMCHS603A': 'Compreender as políticas imperialistas na eclosão da Primeira Guerra Mundial e suas fases.',
  'História|GO-EMCHS603C': 'Analisar o contexto histórico da Rússia no início do século XX e o processo da Revolução Russa de 1917.',
  'História|GO-EMCHS604A': 'Entender as dinâmicas da Segunda Guerra Mundial, a formação da ONU e da OTAN e a Guerra Fria.',
  'História|GO-EMCHS305A': 'Analisar os governos pós-Era Vargas e as políticas ambientais.',
  'História|GO-EMCHS605B': 'Analisar os movimentos de defesa dos Direitos Humanos na Ditadura Militar (1964-1985).',
  'Sociologia|GO-EMCHS103A': 'Compreender o que é Sociologia, seu conceito, origens e principais pensadores.',
  'Sociologia|GO-EMCHS104A': 'Conceituar Cultura, cultura material e imaterial, etnocentrismo e diversidade cultural.',
  'Sociologia|GO-EMCHS401C': 'Compreender a divisão social do trabalho (Durkheim: solidariedade mecânica e orgânica) e a ética protestante e o capitalismo (Weber).',
  'Sociologia|GO-EMCHS402A': 'Compreender o capitalismo, a mais-valia e a teoria do valor (Marx).',
  'Sociologia|GO-EMCHS403A': 'Compreender as novas formas de trabalho (uberização, plataformização, precarização).',
  'Sociologia|GO-EMCHS402B': 'Diferenciar as formas de produção em série, linha de montagem e de produtos mais homogêneos, relacionando-as ao desenvolvimento tecnológico, às mudanças no mundo do trabalho e ao avanço da globalização.',
  'Sociologia|GO-EMCHS402C': 'Analisar a concentração de renda como um dos principais fatores de manutenção da desigualdade social no Brasil, comparando indicadores de instituições oficiais.',
  'Sociologia|GO-EMCHS402D': 'Pesquisar aspectos do trabalho rural e urbano, comparando características e dados (textos, mapas, gráficos e estatísticas do IBGE) para avaliar as relações de poder no mundo do trabalho.',
  'Sociologia|GO-EMCHS403B': 'Compreender os impactos do desenvolvimento tecnológico na organização do mundo do trabalho e na organização espacial, examinando a empregabilidade no contexto das tecnologias e da globalização.',
  'Sociologia|GO-EMCHS403C': 'Reconhecer as formas de trabalho intelectual e manual, utilizando textos científicos, literários e jornalísticos para analisar as transformações no mundo do trabalho.',
  'Sociologia|GO-EMCHS403D': 'Analisar os principais pontos da reforma trabalhista, contextualizando os novos arranjos possibilitados pela legislação e seu impacto na vida dos/as trabalhadores/as.',
  'Sociologia|GO-EMCHS204A': 'Compreender os conceitos de Max Weber sobre o Estado moderno e os tipos de dominação (tradicional, carismática e legal).',
  'Sociologia|GO-EMCHS204C': 'Analisar sociologicamente a divisão social e sexual do trabalho de cuidado no Brasil, relacionando dados sobre trabalho doméstico e de cuidado a desigualdades de gênero, raça e classe.',
  'Sociologia|GO-EMCHS201B': 'Compreender as origens sócio-históricas do capitalismo e os conflitos de classe (teoria de classe social de Karl Marx).',
  'Sociologia|GO-EMCHS205C': 'Debater conflitos sociais, intolerância, racismo e desigualdade no Brasil contemporâneo.',
  'Sociologia|GO-EMCHS603D': 'Entender as diferenças entre Liberalismo e Socialismo e os limites da construção da cidadania no Brasil e na América Latina.',
  'Sociologia|GO-EMCHS604C': 'Analisar o papel dos organismos internacionais (ONU, FMI, Banco Mundial, OMC, OMS) e os limites da cidadania nos países de capitalismo dependente.',
  'Sociologia|EM13CHS605': 'Analisar a aplicação dos Direitos Humanos na realidade do século XXI.',
  'Sociologia|GO-EMCHS605B': 'Refletir sobre democracia e movimentos sociais na garantia dos Direitos Humanos.',
};

async function reconstruirTemasOrfaos() {
  const [turmasSnap, contSnap, temasSnap] = await Promise.all([
    rtdb.ref("leciona/turmas").once("value"),
    rtdb.ref("leciona/conteudos").once("value"),
    rtdb.ref("leciona/temas").once("value"),
  ]);
  const turmas = turmasSnap.val() || {};
  const conteudos = contSnap.val() || {};
  const temasAll = temasSnap.val() || {};

  const planoPorSemana = {};
  PLANO_COMPLETO_FULL.forEach((r) => {
    const chave = r.serie + "|" + r.disc + "|" + segundaDaSemana(r.data);
    planoPorSemana[chave] = r;
  });

  const updates = {};
  let temasRecriados = 0, entradasReligadas = 0;
  const semCorrespondencia = [];

  Object.entries(conteudos).forEach(([cid, c]) => {
    if (!c || !c.turmaId || c.bimestre !== "3º Bimestre" || !Array.isArray(c.planejamento)) return;
    const turma = turmas[c.turmaId];
    if (!turma || turma.ativo === false || !turma.serie) return;
    const serie1 = turma.serie[0];
    const disc = turma.disciplina;

    let ordemAtual = Math.max(0, ...Object.values(temasAll).filter((t) => t && t.conteudoId === cid).map((t) => t.ordem || 0));

    let mudou = false;
    c.planejamento.forEach((p) => {
      if (!p || !p.temaId || temasAll[p.temaId]) return;
      const seg = segundaDaSemana(p.data);
      const info = planoPorSemana[serie1 + "|" + disc + "|" + seg];
      if (!info) { semCorrespondencia.push({ turma: turma.nome + " " + disc, data: p.data }); return; }
      const habilidade = MATRIZ_HABILIDADE[disc + "|" + info.codigo] || "";
      const novoId = rtdb.ref("leciona/temas").push().key;
      ordemAtual++;
      updates["leciona/temas/" + novoId] = {
        id: novoId, conteudoId: cid, turmaId: c.turmaId,
        disciplina: disc, serie: turma.serie, bimestre: "3º Bimestre",
        nome: info.nome, dcgo: info.codigo, habilidade, resumo: "", palavras: "", tempo: "", ordem: ordemAtual,
        obj: { quadro: "", estudo: "", slides: [], mapaMental: "", avaliacao: { questoes: [], flashcards: [], atividade: [], gabarito: [] } },
        imagens: [], status: { estado: "", data: "" }, aprovado: {}, adaptado: {}, updatedAt: Date.now(),
        _recriadoOrfao: true,
      };
      p.temaId = novoId;
      if (!p.obs) p.obs = info.foco;
      if (!p.metodologia) p.metodologia = info.metodologia;
      temasRecriados++;
      entradasReligadas++;
      mudou = true;
    });
    if (mudou) updates["leciona/conteudos/" + cid + "/planejamento"] = c.planejamento;
  });

  if (Object.keys(updates).length) await rtdb.ref().update(updates);
  return { temasRecriados, entradasReligadas, semCorrespondencia: semCorrespondencia.length, detalheSemCorrespondencia: semCorrespondencia.slice(0, 30) };
}

exports.reconstruirTemasOrfaosAgora = onCall(
  { region: "southamerica-east1", timeoutSeconds: 120, memory: "256MiB" },
  async (request) => {
    verificarAcesso(request);
    try {
      return await reconstruirTemasOrfaos();
    } catch (e) {
      throw new HttpsError("internal", "Erro ao reconstruir temas: " + (e.message || String(e)));
    }
  }
);
