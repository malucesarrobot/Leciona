# Automação SIAP (Conteúdo Programático + Frequência)

Automação via CDP (Chrome DevTools Protocol) pra lançar conteúdo e frequência no
SIAP a partir dos dados já registrados no Leciona (Firebase), sem precisar clicar
manualmente turma por turma, data por data. Construída e testada numa sessão real
lançando 3º bimestre inteiro (agosto) de Sociologia, Filosofia e Estudo Orientado
em ~20 turmas-disciplina, mais os retoques de setembro.

## Por que existe

O SIAP não tem API — a única forma de lançar dado lá é pela interface web, um
clique de cada vez. Fazer isso manualmente pra ~20 turmas × ~4-5 datas cada é
inviável. Esta automação conecta no Chrome já aberto e logado, e faz os cliques
por você, usando o Firebase (dados reais das aulas dadas) como fonte da verdade.

## Como usar (toda vez que for lançar algo)

1. **Abra o Chrome de automação** (perfil isolado, não mexe no seu Chrome normal):
   ```bash
   nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --remote-debugging-port=9222 \
     --user-data-dir="/tmp/chrome-siap-automation" \
     > /tmp/chrome-siap.log 2>&1 &
   ```
   (Se já tiver uma janela dessas aberta de uma sessão anterior, não precisa abrir de novo.)

2. **Faça login manualmente** em https://siap.educacao.go.gov.br nessa janela — é a
   sua sessão, sua senha, a automação nunca vê nem precisa disso.

3. **Rode os scripts Node** a partir desta pasta (`siap-automation/`). Eles se
   conectam sozinhos na aba do SIAP já aberta:
   ```bash
   cd siap-automation
   node exemplo.js   # ou um script seu adaptado do exemplo.js
   ```

Não precisa reabrir o Chrome nem logar de novo entre um script e outro — a
conexão é feita e fechada a cada execução, mas a aba (e a sessão logada)
continua aberta no navegador.

## Arquivos

- **`cdp.js`** — cliente CDP puro (WebSocket nativo do Node), sem Playwright.
  Funções: `connect`, `evaluate`, `click`, `fill`, `realClick`,
  `clickAndVerify`, `waitMs`, `close`.
- **`nav.js`** — navegação de alto nível: `navigateToFrequencia` (Listagem →
  turma → Conteúdos → Frequência → mês), `selecionarMes`, `gotoDate` (clica
  numa data do calendário e CONFIRMA que deu certo antes de devolver).
- **`exemplo.js`** — modelo comentado mostrando o fluxo completo (conteúdo +
  frequência) pra uma turma+data. Copie e adapte — não é genérico o bastante
  pra rodar sem editar as matrículas/datas de cada caso.

## Por que Playwright não funciona aqui

`chromium.connectOverCDP()` do Playwright trava no handshake com o Chrome
150.x usado nesta automação (`Target.setAutoAttach`/attach individual nunca
retorna). O protocolo CDP puro (fetch pro `/json/list` + `/json/version`,
depois WebSocket direto) funciona perfeitamente — foi isso que motivou o
`cdp.js` próprio em vez de usar Playwright. Se um dia atualizar o Chrome e
quiser tentar Playwright de novo, teste com cuidado antes de trocar tudo.

## Armadilha mais importante: cliques sintéticos não funcionam nas células do calendário

`el.click()` via `Runtime.evaluate` funciona normalmente em botões
(`<input type=submit>`, como "Executar" e "Salvar") mas **não** funciona nas
células do calendário mensal (`td[data-canonica="..."]`) — o clique sintético
não dispara o handler delas, então a data nunca muda e o estado da tela fica
"grudado" na data anterior. Isso já causou uma sessão inteira de dados
salvos na data errada até a causa ser identificada.

**Solução**: usar `cdp.realClick()` (dispara `Input.dispatchMouseEvent` com
coordenadas reais, exatamente como o Playwright faz por baixo dos panos) pra
qualquer célula de calendário ou item de frequência. `cdp.click()` (sintético)
só é seguro pra botões normais (`Executar`, `Salvar`, `Listar`, abas).

**Sempre confirme a navegação antes de mexer em qualquer coisa**: use
`nav.gotoDate()`, que já faz esse "clica e confirma" com retry. Nunca marcar
falta ou conteúdo sem antes confirmar que a data/turma realmente mudou.

## Conteúdo Programático

- Cada data mostra um item sugerido em "Conteúdo Planejado" (vindo do
  planejamento anual do professor no SIAP) — geralmente já bate com o tema
  do Leciona. Clique no botão "Executar" desse item
  (`#cphFuncionalidade_cphCampos_grdPlanejado_Button1_0`).
- Se o sugerido **não bater** com o que foi dado de verdade (compare com
  `leciona/registros` daquela turma+data), clique em
  **"Outros Conteúdos"** (`#cphFuncionalidade_cphCampos_BtnContrOutrosConteudos`)
  pra abrir o catálogo completo do ano e escolher manualmente o item certo.
- **Um tema por dia real de aula.** Se o SIAP mostrar 2 itens sugeridos na
  mesma data, normalmente é porque 2 datas de aula ficaram acumuladas na
  fila (uma não foi marcada antes) — não marque os dois juntos; marque um
  agora e o outro na próxima data real de aula.
- **Material de Apoio** é obrigatório salvar (sem isso o SIAP recusa com
  "É necessário informar se utilizou material de apoio"). Ordem dos botões
  na tabela: 0 Revisa Goiás, 1 Ser Goiás/Desafio Crescer, 2 Goiás TEC,
  3 Goiás English, 4 Conectando Palavras/Letrus, 5 Redação Nota 1000,
  **6 Outros**, 7 Nenhum material de apoio utilizado.
  - Se o Leciona indicar um desses programas específicos, use o item certo.
  - Se não, prefira **"Outros"** com o texto livre `"Material autoral"` (ou
    `"Debate temático"` quando fizer mais sentido) — não use "Nenhum" só
    porque é mais rápido; "Nenhum" é só pra quando realmente não teve
    nenhum tipo de material na aula.
- Quando o Leciona não tem nenhum registro confiável pra uma data (tema
  órfão, nota vazia, sem registro nenhum), use a sugestão do próprio SIAP —
  ela reflete o planejamento anual, é uma aproximação razoável.

## Frequência

- **Use `aluno.matricula` do Firebase como chave**, não o nome — evita erro
  de grafia (ex.: "Fraça" vs "França", "Gilmar Almeida Santos" vs
  "...dos Santos"). Nem todo aluno tem `matricula` preenchida no Leciona
  ainda; quando faltar, pegue a lista de `.listaDeAlunos .item` da própria
  página do SIAP (tem `data-matricula` de cada aluno) e casa por nome.
- Alunos com `data-codigosituacao="T"` (Transferido) aparecem cinza/travados
  na grade — não dá (e não deve) marcar frequência pra eles.
- **A grade de frequência (`.listaDeFrequencias .item[data-ausente]`) não
  reseta sozinha ao trocar de data** — ela pode reter cliques de uma data
  anterior se a navegação falhou silenciosamente. Por isso: sempre leia o
  estado atual, calcule o diff (quem remover, quem adicionar) contra o
  esperado, e só clique nesse diff — nunca assuma que a grade está "limpa"
  ao chegar numa data nova.
- **Sempre confira o resultado final bate exatamente com o esperado antes
  de clicar Salvar.** Se não bater, não salve — investigue antes (foi assim
  que um lançamento errado de frequência foi pego a tempo nesta sessão).

## Mapeamento de dia da semana: SIAP é a fonte da verdade, não o Leciona

O `SCHEDULE` do Leciona (`index.html`/`functions/index.js`) às vezes diverge
do calendário oficial do SIAP pra uma mesma turma-disciplina (ex.: Leciona
registra conteúdo numa sexta-feira, mas o dia real de aula no SIAP pra
aquela turma é quinta). **Sempre confirme os dias letivos reais consultando
o próprio SIAP** (`td[data-planejado="True"]` no calendário mensal) antes de
decidir quais datas do Leciona usar como fonte — não confie cegamente no
`SCHEDULE`. Quando a data exata não bater, use a data do Leciona mais
próxima (mesma semana) como aproximação razoável.

## Códigos usados nos filtros

- Composição de Ensino: `571` (Ensino Médio Concomitante Intercomplementar —
  único vínculo usado nesta automação; o 9º ano/CEPI Marajó usa outra
  composição, não coberta aqui).
- Série: `nav.SERIE['1'|'2'|'3']` → `5711`/`5712`/`5713`.
- Disciplina: `nav.DISCIPLINA.Historia|Sociologia|Filosofia|EstudoOrientado`
  → `4`/`16`/`15`/`1841`.
- Turno: sempre `1` (Matutino) — não há turmas à tarde nesta automação.

## Frequência — "selo de gravação" (descoberto em 20/09/2026)

Antes de tentar lançar/corrigir frequência de uma data, **checar primeiro sem
abrir a data**, direto na célula do calendário mensal
(`td[data-canonica="YYYY/M/D"]`):
- `data-lancamento-frequencia="True"` → **já foi lançado** — pular, não abrir
  nem clicar em nada (a Malu chama isso de "selo de gravação" — ela vê no
  painel "Histórico detalhado", no rodapé da página de frequência de uma
  data já aberta, uma entrada `.containerHistorico` por gravação feita, com
  nome/CPF/data-hora/"Ação: Inclusão"; o atributo do calendário é o mesmo
  sinal, só que consultável sem precisar abrir a data).
- `class` **sem** `"dialog letivo"` (geralmente `class=""`) → o SIAP **não
  considera esse dia letivo pra essa turma-disciplina** — clicar nele não
  funciona (não é bug de clique, a célula genuinamente não é interativa).
  Se o Leciona tem uma chamada registrada nessa data mesmo assim, é uma
  inconsistência de dado pra conferir com a Malu, não algo pra forçar via
  automação (aconteceu com Filosofia 1ªB numa quinta-feira — o SIAP só
  reconhece quarta como dia letivo dessa turma-disciplina).
- Só quando `data-lancamento-frequencia="False"` **e** a classe tem
  `"dialog letivo"` é que vale a pena abrir a data (`gotoDate`) e seguir o
  fluxo normal de diff+clique+salvar.
- Implementado em `lancar-frequencia.js` (`lancarFrequenciaTurma`) — checa
  isso ANTES de chamar `gotoDate`, evitando abrir datas que não precisam
  de nada e evitando depender do clique (que falha com alguma frequência)
  pra decidir se algo já está pronto.
- **Regra geral de escopo** (pedido explícito da Malu em 20/09): não
  reprocessar tudo toda vez — atualizar só as turmas que tiveram aula nos
  dias pedidos e que ainda não estão preenchidas. Só fazer um reprocessamento
  completo de um período quando ela pedir uma "varredura" explícita.

## Notas (NotasModeloEdicao.aspx) — descoberto em 18/09/2026

Página diferente das de Conteúdo/Frequência (não usa `nav.js`). Chega nela
por Diário do Professor → Listar → escolher turma → aba "Notas". Estrutura:

- Acordeão horizontal com seções `Alunos` / `Av. Subjetivas` / `Av. Objetivas`
  (e mais colunas calculadas: Média Parcial, Recuperação, Faltas, Média
  Bimestral — só leitura, o SIAP calcula sozinho a partir dos instrumentos).
- Cada **instrumento avaliativo já criado** aparece como um bloco
  `.lista.listaDeNotas` dentro de "Av. Subjetivas" ou "Av. Objetivas", com
  atributos: `data-id` (ID do instrumento, usado na gravação), `data-ciclo`
  (ex. "1" pro modelo Ciclo 1), `title` (a descrição digitada ao criar, ex.
  "atividades avaliativas"). Se não existe nenhum instrumento numa seção,
  ela mostra só o texto "Avaliação não lançada".
- Dentro de cada instrumento, um `.item.subjetiva.nota[data-matricula="…"]`
  por aluno (mesma matrícula que aparece em `.listaDeAlunos .item`), com um
  `<input class="seeTextField">` pra nota. Alunos com `data-bloqueado="True"`
  (ex. transferidos) não devem ser preenchidos.
- **O clique+blur simulado na interface é pouco confiável pra gravar nota
  — usar `fetch()` direto, não simular clique/digitação.** Descoberto em
  21/09/2026 depois de uma sessão inteira tentando entender por que alguns
  alunos "sumiam" ao recarregar mesmo com `input.value` mostrando certo
  logo depois do `blur()`: o clique sintético/teclado real às vezes não
  dispara o `POST WMAtualizaNotaSubjetiva` pra campos específicos, sem erro
  visível — client-side, não é sobre "Enviar para o SIGE" (esse clique
  também é pouco confiável de automatizar, mas **não é obrigatório pra
  persistir**, apesar do que uma versão anterior deste README dizia).
  **Solução: chamar o endpoint direto via `fetch()`** de dentro do
  contexto da página (mesma origem, cookies automáticos):
  ```js
  await fetch('/DiarioDoProfessorWebMethods.aspx/WMAtualizaNotaSubjetiva', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ indiceAvaliacao, matricula, nota })  // nota: número, ex. 7.5
  });
  ```
  `indiceAvaliacao` é o `data-id` do `.lista.listaDeNotas` daquele
  instrumento (**pode haver mais de um instrumento com nomes parecidos
  numa mesma seção** — ex. "Atividades Avaliativas" vs "Atividades
  Avaliativas - seminarios" — cada aluno pertence a um; usar o `data-id`
  errado devolve HTTP 500 "Index was out of range" bem claro, então dá pra
  detectar). A resposta é `{"d":"{\"Ciclos\":[...],\"Parcial\":{...}}"}` —
  o campo `Nota` aí dentro é a **média recalculada** (parcial/ciclo), não
  eco do valor enviado; não comparar com o que foi mandado, só checar
  `status === 200`. Implementado em `lancar-notas.js`
  (`lancarNotasSubjetiva` + `achaIndiceAvaliacao`) — testado e confirmado
  100% confiável em ~15 alunos de turmas diferentes depois da migração pro
  `fetch()` direto, contra várias falhas silenciosas com o método antigo de
  simular clique.
  - **Mesmo assim, sempre confirme com um reload de página fresco depois**
    — nunca conclua "deu certo" só pelo `status === 200` da resposta nem
    pelo `input.value` da tela.
- **Armadilha do campo de nota**: é uma máscara estilo valor monetário, não
  um campo de texto normal. Setar `el.value = '4'` vira **"0,4"**, não "4,0"
  — o dígito entra pela casa decimal e empurra os que já estavam pra
  esquerda. Pra lançar uma nota `X,Y` (uma casa decimal), setar
  `el.value = String(Math.round(nota*10))` (ex.: nota 4 → `"40"` → mostra
  "4,0"; nota 0 → `"0"` → "0,0"; nota 7,5 → `"75"` → "7,5"). Sempre ler
  `input.value` de volta depois do `blur()` pra confirmar que bateu com o
  esperado (mesmo padrão de `clickAndVerify` do `cdp.js`) — não existe
  `data-matricula`/`data-nota` fidedigno até o blur disparar o AJAX.
- **Criar um instrumento novo — testado e funcionando em 20/09.** O "+"
  (`.controle.adicionar`) no cabeçalho de "Av. Subjetivas"/"Av. Objetivas"
  **não é clicável de forma confiável**: o clique real (`realClick`) acerta
  o elemento certo (confirmado via `elementFromPoint`, handler jQuery
  presente) mas o handler do botão captura `$elItemConteudoAvaliacoes` numa
  variável de clausura vinculada na hora que a seção foi montada — depois
  de navegar entre turmas via SPA sem reload de página essa referência fica
  obsoleta e o clique não produz nenhum efeito visível (sem erro, sem
  requisição de rede). **Solução: pular o clique e chamar a API JS
  diretamente**, via `evaluate()`:
  ```js
  const m = new ViewModalAvaliacao();          // cria e já injeta o dialog real no DOM (visível, funcional)
  m.on("avaliacaoCriada", function(data){       // mesmo listener que o handler original registraria
    const viewAvaliacao = new ViewAvaliacaoModelo();
    viewAvaliacao.montaComBaseNaTabelaDeAlunos(data.Avaliacao, $(".lista.listaDeAlunos")[0], data.indiceAvaliacao);
    $(itemConteudoDaSecaoCerta.querySelector('.listaTableWrap')).append(viewAvaliacao.renderiza().el);
    $(".nota").find("input").on("keyup", /* ...máscara de backspace, ver handler original... */);
    definirMascara();
  });
  // esperar a lista de modelos popular via AJAX (assíncrono, ~1-2s) antes de ler as options:
  const sel = m.el.querySelector('select[name=modelo]');
  sel.value = '239';  // "Ciclo1 - CEPI Ensino Médio" — value varia por escola/turma, ler as options antes
  const desc = m.el.querySelector('input[name=descricao]');
  desc.value = 'Atividades Avaliativas';
  m.callbackBtnConfirmar();   // método real no protótipo — NÃO precisa clicar no botão "Confirmar"
  ```
  `m.callbackBtnConfirmar()` dispara o `POST WMCriaAvaliacaoSubjetiva` de
  verdade (`{descricao, tipoAvaliacao, peso, ciclo, subjetiva:<value do
  modelo>}`) e, no callback de sucesso, emite `avaliacaoCriada` com os dados
  do instrumento recém-criado (já incluindo a lista de 35 `itens` por
  matrícula com `nota:""`) — o listener acima monta e injeta a tabela real
  na tela, pronta pro `lanca-notas-siap.js` preencher normalmente. Truque
  geral: quando um clique real não produz efeito e o handler jQuery
  encontrado via `elementFromPoint`/`_data(el,'events')` referencia
  closures possivelmente obsoletas, inspecionar o protótipo do objeto
  relevante (`Object.getOwnPropertyNames(Object.getPrototypeOf(instancia))`)
  e chamar o método de callback direto — bypassa o DOM inteiro.

**Mapeamento Leciona → SIAP (acordado com a Malu em 18/09):**
- Atividades tipo checklist no Leciona (✓/vazio) → um único instrumento
  **subjetivo** "Atividades Avaliativas" (modelo Ciclo 1) por turma-
  disciplina-bimestre; o valor lançado é a **média já calculada pelo
  Leciona** (`mediaAluno`) pra aquele conjunto de atividades — não recalcular
  na mão.
- Atividades numéricas (trabalho/seminário/artigo/pesquisa) no Leciona → um
  segundo instrumento **objetivo** "Pesquisa" (a criar quando a turma tiver
  esse tipo de atividade lançada) — 2 instrumentos separados, nunca somados
  num só campo (pedido explícito: "instrumento 1" e "instrumento 2").
- Avaliação Qualitativa (comportamento, só 9º ano) é outra categoria ainda
  não mapeada nesta automação — usa a mesma fonte que
  `atualizarQualitativaPlanilhaAgora` em `functions/index.js`.
- Casar aluno Leciona↔SIAP: nome normalizado (maiúsculo/trim) quando a
  matrícula não está em mãos nos dois lados na mesma consulta — **sempre
  conferir contagem e diferença de nomes entre os dois rosters antes de
  escrever** (visto no 1ªA-Filosofia: 35 SIAP ativos batendo exatos com 35
  do Leciona; mas já existiu um par quase-duplicado tipo "FRANÇA"/"FRAÇA"
  em outra turma vindo de erro de digitação da planilha do Arlan — não
  supor que sempre bate 1:1 sem checar).
- Pendente: testar o mesmo fluxo de criação de instrumento pra "Av.
  Objetivas" (deve ser análogo, trocando o `tipoAvaliacao`/seção-alvo —
  ainda não testado porque nenhuma turma teve atividade numérica lançada no
  Leciona até agora), testar Avaliação Qualitativa (9º ano), e decidir a
  regra de "atualizar só quem mudou" (comparar `input.value` atual contra a
  média do Leciona antes de escrever, só tocando o que diverge — ainda não
  implementado como script reutilizável, foi feito manualmente turma por
  turma em 18/09).
- **Lição crítica sobre dados desatualizados (19/09):** notas lançadas numa
  primeira passada de 1ªA-Filosofia ficaram baixas demais porque a lista de
  atividades do Leciona **mudou** (2 atividades removidas) depois da
  extração original ter sido salva num arquivo JSON de cache. **Nunca
  reusar um JSON de extração de uma sessão anterior pra escrever no SIAP —
  sempre buscar `mediaAluno`/`atividadesDaTurma` ao vivo no Leciona
  imediatamente antes de cada lançamento**, mesmo que pareça a mesma turma
  de minutos atrás.

## Estado em 16/09/2026

3º bimestre (agosto) completo em Sociologia (7 turmas), Filosofia (7 turmas)
e Estudo Orientado I (2B) — conteúdo e frequência. História (7 turmas) já
tinha as **notas** lançadas antes desta automação existir, mas o **Conteúdo
Programático e Frequência de agosto** de História **não** foram conferidos
nem lançados por esta automação — só os retoques pontuais de setembro
(15/09 em 3A/3B/3C) foram feitos. Ainda é preciso avaliar se vale a pena
rodar História de agosto inteiro do mesmo jeito.
