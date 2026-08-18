# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## O que é isto

Leciona é um PWA de gestão de sala de aula pra uma única professora (planejamento, notas, chamada, tela de projeção, geração de conteúdo de aula com IA), em uso real em produção. É um site estático (sem bundler, sem framework, sem `package.json` na raiz) publicado no GitHub Pages, com Firebase Realtime Database e um pequeno conjunto de Cloud Functions no back-end. Comentários e textos da interface estão em português; mantenha código/comentários novos em português também.

## Comandos

Não há build, gerenciador de pacotes nem suíte de testes na raiz. O fluxo de desenvolvimento é "editar o arquivo, checar sintaxe, publicar".

- **Checar sintaxe antes de publicar**: `node --check catalog.js`, `node --check prebuilt.js`, e para o `<script>` inline do `index.html`, extraia o bloco e rode `node --check` nele (é exatamente o que `deploy.sh` automatiza).
- **Publicar o front-end**: `./deploy.sh "descrição da mudança"` — valida a sintaxe JS (aborta se houver erro), renomeia o cache em `sw.js` (`CACHE = 'leciona-<timestamp>'`, força os navegadores a buscar a versão nova em vez de servir a antiga), depois faz `git add -A && git commit` e `git push origin main`. O GitHub Pages atualiza em 1–2 minutos em https://malucesarrobot.github.io/Leciona/. **O `deploy.sh` faz commit e push pra `main` sozinho** — só rode quando a intenção for realmente publicar, não como um "salvar o progresso" de rotina.
- **Cloud Functions** ficam em `functions/` (`cd functions && npm install` uma vez). Publique com `firebase deploy --only functions` (ou `firebase deploy --only functions:<nome>` pra uma função só) — também não há lint/teste separado ali; `node --check functions/index.js` é a checagem de sanidade.
- **Regras do Firebase Realtime Database**: `database.rules.json`, publique com `firebase deploy --only database`.

## Arquitetura

### Front-end: um único `index.html` gigante

`index.html` (~8,8 mil linhas) é o app inteiro: marcação, CSS e um único `<script>` inline com toda a lógica do cliente. Não há sistema de módulos — tudo é `function`/`let`/`const` no escopo de topo. Pra localizar uma funcionalidade, use `grep -n` dentro do `index.html` em vez de esperar arquivos separados.

- **Telas (views)** são elementos `<div id="view*">` alternados via classe `hidden`: `viewHoje` (hoje/painel do dia), `viewAgenda`, `viewGestao`, `viewAcervo`, `viewNotas`, `viewLinhaTempo`, `viewPainel`, `viewProjecao` (tela de projeção em sala) e `viewRanking`.
- **Estado global** é um conjunto de objetos `let` de topo indexados por id, carregados do Firebase e espelhados no `localStorage`: `temas`, `conteudos`, `turmas`, `alunos`, `chamadas` (presença), `registros`, `ocorrencias`, `compromissos`, `aulasAvulsas`, `notasGerais`, `atividadesCtrl`, `notasCtrl`, `qualitativa` (descontos da nota qualitativa), além de `scope` (seleção atual de disciplina/série/turma/bimestre) e `proj` (estado da projeção). Ver o bloco de `let` a partir de `index.html:1168` pra lista completa com comentários explicando cada um.
- **catalog.js**: catálogo gerado (não editado à mão) de subtemas curriculares por código DC-GO/BNCC. Carregado uma vez no boot.
- **prebuilt.js + prebuilt-{historia,filosofia,sociologia}.js**: conteúdo de aula pré-pronto (quadro/estudo/slides/mapa mental), separado por disciplina e carregado sob demanda via `ensurePrebuiltDiscLoaded()`, pra evitar baixar o conteúdo de todas as disciplinas de uma vez. Conteúdo de aula novo é gerado a partir de um `.docx` via `converter.py` (ver abaixo), não digitado direto nesses arquivos.
- **Service worker (`sw.js`)**: cache-first pro app shell e libs de CDN, mas ignora o cache explicitamente (sempre rede) pros hosts `anthropic.com`, `firebaseio.com`, `googleapis.com`, `wikimedia.org`, `gstatic.com`. Renomear `CACHE` (feito pelo `deploy.sh`) é o que de fato invalida os clientes antigos — editar arquivos sem renomear o cache significa que os usuários continuam vendo código velho.

### Modelo de sincronização: Firebase RTDB + localStorage, tolerante a offline

Cada coleção é carregada via `DB.ref('leciona/<coleção>').on('value', ...)`, mesclada com a cópia local por `mergeRemote()` (`index.html:1245`) e cacheada no `localStorage`. A regra de mesclagem é deliberada e fácil de quebrar por engano: **um id que existe só localmente significa que foi apagado no remoto — nunca ressuscitar.** Só quando o mesmo id existe local e remotamente, com `updatedAt` local mais novo, é que a versão local prevalece e é reenviada. Isso existe por causa de um bug real em produção onde um aparelho com cache desatualizado "trazia de volta" itens já apagados a cada reload — não crie exceções pra essa regra sem entender por que ela existe.
- `?safe=1` na URL troca os listeners ao vivo `.on('value')` por leituras únicas `.once('value')` (salvar/excluir manualmente continua funcionando) — útil pra depurar sem disparar efeitos colaterais em tempo real.
- `pushBackSeguro()` limita a taxa de reenvios repetidos (máx. 8 a cada janela de 10s) e pausa a sincronização com um toast se ultrapassar, como proteção contra tempestades de sincronização.

### Back-end: `functions/index.js` — um proxy deliberadamente burro

Todas as Cloud Functions rodam em `southamerica-east1`. O acesso a cada função chamável é controlado por `verificarAcesso()`, que checa o e-mail de quem chama contra uma lista fixa (`prof.malufc@gmail.com`, `malu.cesar@gmail.com`) — é um app de uma professora só, não um produto multiusuário.

- **`gerarComIA`**: o único ponto de entrada de IA. É um proxy propositalmente "burro" pra `POST https://api.anthropic.com/v1/messages` — repassa `system`/`messages`/`tools`/`model` como recebidos e devolve a resposta crua. Toda a lógica de negócio do que cada ferramenta faz (criar um compromisso, consultar a agenda etc.) mora no cliente, em `index.html` (`FERRAMENTAS_ASSISTENTE` + o loop de uso de ferramentas do assistente por volta de `index.html:4075`), não nesta function. Não mova lógica de negócio pra cá — é uma escolha de arquitetura deliberada, não um descuido.
- **`corrigirCampos`**: válvula de escape pra correção pontual de campos direto na RTDB quando um dado está errado. Restrita a caminhos que começam com `"leciona/"`.
- **Importações de planilha** — dois pipelines independentes, agendados/sob demanda, ambos idempotentes por design:
  - `importarPlanilhaAgora` / `importarPlanilhaAgendado` (dias úteis, 19h30 America/Sao_Paulo): importa linhas de falta/ocorrência de uma planilha do Google mantida pela coordenação, gravando em `leciona/chamadas` e `leciona/qualitativa`. A idempotência é controlada via `leciona/_importLog`, então rodar de novo nunca duplica nem sobrescreve o que a professora já editou manualmente; uma chamada feita à mão pra uma turma+dia nunca é sobrescrita. Nomes que não batem com exatamente um aluno do roster (via `encontrarAluno`/casamento fuzzy por Levenshtein, ver `tokensBatem`) viram pendência em `leciona/_importPendencias` em vez de arriscar um chute. **Atenção**: uma ocorrência qualitativa desconta `-0,1` em *todas* as turmas-disciplina que a professora dá pro aluno, não só uma — ver memória de projeto `feedback_planilha_import_mapping`.
  - `atualizarQualitativaPlanilhaAgora` / `atualizarQualitativaPlanilhaAgendado` (sextas, 20h): o caminho inverso — grava o total acumulado de descontos da nota qualitativa de volta numa planilha compartilhada da escola (`PLANILHA_QUALITATIVA_ID`), só na coluna `HIST`, nunca mexendo nas colunas de outras professoras. Os valores são totais absolutos (não incrementais), seguro rodar de novo quantas vezes for.
- **`registrarAulasPassadasAgora`** / **`excluirTurmasObsoletasAgora`**: funções chamáveis pontuais de backfill/limpeza, mantidas como botões em Configurações pra reuso ocasional em vez de serem apagadas depois do uso original.
- Existe um endpoint `importarPlanilhaHttp`, mas está desativado (`if (false) exports....`), com um comentário explicando que precisa de um segredo configurado manualmente fora do Claude Code antes de ser habilitado — não troque esse `false` por `true` "pra ajudar" sem a usuária ter configurado o `IMPORT_SECRET` ela mesma antes.

### Autenticação e segredos

O login é via Google Sign-In pelo Firebase Auth; o app inteiro fica atrás de um gate de login (`auth.onAuthStateChanged`). Tanto as regras da RTDB (`database.rules.json`) quanto cada função chamável checam independentemente o e-mail de quem chama contra a mesma lista de dois endereços — mudar o acesso exige atualizar os dois lugares. A chave da API Anthropic vive só no Secret Manager das Cloud Functions (`ANTHROPIC_API_KEY`), nunca no código do cliente; isso substituiu um esquema antigo em que a chave era colada no navegador, motivo de `gerarComIA` existir como proxy.

## Fluxo de criação de conteúdo

`converter.py` transforma um `.docx` (exportado via `pandoc -t markdown`) em entradas de `prebuilt.js`/`prebuilt-<disciplina>.js`. Rode sem `--write` primeiro (dry-run — só mostra prévia + relatório); adicione `--write` pra gravar de fato, `--force` pra sobrescrever entradas já existentes do mesmo nome de tema. O nome do tema no documento precisa bater exatamente com um tema já cadastrado no Leciona (é a chave de busca em `getPrebuilt()`). O código BNCC/DC-GO (`Código: GO-EF09HI13-A`) só é usado se vier explícito no documento — o script nunca inventa nem infere esse campo.
