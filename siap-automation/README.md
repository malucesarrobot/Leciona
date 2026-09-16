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

## Estado em 16/09/2026

3º bimestre (agosto) completo em Sociologia (7 turmas), Filosofia (7 turmas)
e Estudo Orientado I (2B) — conteúdo e frequência. História (7 turmas) já
tinha as **notas** lançadas antes desta automação existir, mas o **Conteúdo
Programático e Frequência de agosto** de História **não** foram conferidos
nem lançados por esta automação — só os retoques pontuais de setembro
(15/09 em 3A/3B/3C) foram feitos. Ainda é preciso avaliar se vale a pena
rodar História de agosto inteiro do mesmo jeito.
