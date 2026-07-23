/* Leciona — núcleo do sistema de conteúdo pré-pronto.
   O conteúdo em si mora em arquivos separados por disciplina
   (prebuilt-historia.js, prebuilt-filosofia.js, prebuilt-sociologia.js),
   carregados sob demanda por ensurePrebuiltDiscLoaded() em vez de tudo de
   uma vez no boot — isso evita baixar alguns MB de conteúdo de outras
   disciplinas que a professora pode nem estar usando nessa sessão. */
const PREBUILT_OBJ = {};
const PREBUILT_ADAPT = {};

const PREBUILT_DISC_FILE = {
  'História': 'prebuilt-historia.js',
  'Filosofia': 'prebuilt-filosofia.js',
  'Sociologia': 'prebuilt-sociologia.js',
};
const _prebuiltLoaded = new Set();
const _prebuiltLoading = {};

/* Chamado pelo próprio arquivo de disciplina ao final, só pra registrar
   que terminou de carregar (não é estritamente necessário — o onload do
   <script> já resolve a Promise — mas serve de checagem redundante). */
function _prebuiltLoadedMark(disc){ _prebuiltLoaded.add(disc); }

/* Garante que o pré-pronto de uma disciplina está carregado antes de
   consultar PREBUILT_OBJ/PREBUILT_ADAPT pra ela. Sem arquivo mapeado
   (Eletiva, Estudo Orientado etc.) resolve na hora — não há o que buscar.
   Idempotente: chamadas repetidas pra mesma disciplina reaproveitam a
   mesma Promise (só baixa uma vez). */
function ensurePrebuiltDiscLoaded(disc){
  const file = PREBUILT_DISC_FILE[disc];
  if(!file || _prebuiltLoaded.has(disc)) return Promise.resolve();
  if(_prebuiltLoading[disc]) return _prebuiltLoading[disc];
  _prebuiltLoading[disc] = new Promise((resolve)=>{
    const s=document.createElement('script');
    s.src=file;
    s.onload=()=>{ _prebuiltLoaded.add(disc); resolve(); };
    // se o arquivo falhar (offline na primeira visita, etc.), não trava o
    // app — só segue sem pré-pronto pra essa disciplina, como se não
    // existisse (mesmo comportamento de antes de existir prebuilt.js).
    s.onerror=()=>resolve();
    document.head.appendChild(s);
  });
  return _prebuiltLoading[disc];
}

/* Pré-carrega as 3 disciplinas em segundo plano, sem bloquear nada —
   dá tempo pro shell do app renderizar primeiro. Puramente um "aquecimento":
   qualquer chamada que realmente precise do pré-pronto (popular pela
   matriz, adaptar, forçar pré-pronto) já espera o carregamento dela mesma,
   então isso aqui só faz as coisas ficarem prontas mais cedo em segundo
   plano pros casos silenciosos (ex.: seedAllPrebuilt no boot). */
function prefetchPrebuiltEmSegundoPlano(){
  setTimeout(()=>{
    Object.keys(PREBUILT_DISC_FILE).forEach(d=>ensurePrebuiltDiscLoaded(d));
  }, 2500);
}

/* Busca o pré-pronto de um tema, em ordem de prioridade:
   1) nome exato do tema — prioridade máxima. Resolve o caso de um código
      ter vários subtemas cadastrados (ex.: GO-EMCHS502C tem "sofistas" E
      "Benjamin Constant"): se o tema já tem o nome específico de um deles,
      tem que pegar EXATAMENTE aquele, não "o primeiro que aparecer".
   2) match exato do nome do tema (caso o tema já tenha o nome do
      subtema granular, ex. veio de "Partir da matriz" com subtema
      selecionado, ou foi renomeado manualmente para bater).
   3) match do nome ignorando maiúsculas/espaços.
*/
function getPrebuilt(t){
  if(!t) return null;
  if(t.nome){
    const nome=t.nome.trim();
    if(PREBUILT_OBJ[nome]) return PREBUILT_OBJ[nome];
    const nomeLow=nome.toLowerCase();
    const key=Object.keys(PREBUILT_OBJ).find(k=>k.toLowerCase().trim()===nomeLow);
    if(key) return PREBUILT_OBJ[key];
  }
  // 2) fallback por código DC-GO — só entra em ação quando o tema tem um
  //    nome genérico (nível habilidade, ex. "Liberdade de expressão" vindo
  //    direto da matriz, sem subtema escolhido) que não bate com nenhum
  //    subtema específico. Nesse caso, usa o primeiro subtema disponível
  //    daquele código como aproximação.
  if(t.dcgo && typeof SUBTEMAS!=='undefined'){
    const candidatos=[];
    const porDisc = t.disciplina && SUBTEMAS[t.disciplina+'|'+t.dcgo];
    const porCodigo = SUBTEMAS[t.dcgo];
    (porDisc||[]).forEach(o=>o&&o.s&&candidatos.push(o.s));
    (porCodigo||[]).forEach(o=>o&&o.s&&candidatos.push(o.s));
    for(const cand of candidatos){
      if(PREBUILT_OBJ[cand]) return PREBUILT_OBJ[cand];
    }
  }
  return null;
}

/* Aplica o pré-pronto disponível a um tema, campo a campo.
   Não é tudo-ou-nada: se o tema já tem Quadro escrito mas nunca
   recebeu Slides/Avaliação (ex.: gerado por uma versão antiga da IA,
   ou por uma migração incompleta), esta função completa só o que falta,
   sem apagar o que já existe. */
function applyPrebuiltIfEmpty(t){
  if(!t||!t.nome) return false;
  const pb=getPrebuilt(t);
  if(!pb) return false;
  if(!t.obj) t.obj={};
  const o=t.obj;
  const campoVazio=(k)=>{
    const v=o[k];
    if(v==null) return true;
    if(k==='avaliacao'){
      return !(typeof v==='object' && !Array.isArray(v) && Object.values(v).some(a=>Array.isArray(a)?a.length>0:String(a||'').trim().length>0));
    }
    if(Array.isArray(v)) return v.length===0;
    if(typeof v==='object') return Object.keys(v).length===0;
    return !String(v).trim();
  };
  let mudou=false;
  ['quadro','estudo','slides','mapaMental','avaliacao'].forEach(k=>{
    if(campoVazio(k) && pb[k]!=null){ o[k]=pb[k]; mudou=true; }
  });
  if(mudou) persistTema(t);
  return mudou;
}

/* Popula PREBUILT em todos os temas vazios que têm conteúdo disponível. */
/* seedAllPrebuilt() vive em index.html (roda como parte do migrateAndRender) */
