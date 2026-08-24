/* Leciona — importação única do planejamento oficial do 3º Bimestre 2026.
   Fonte: documento "leciona-planejamento-3bim-completo" (Drive, gerado
   24/08/2026) — tema, código BNCC/DC-GO, habilidade, metodologia e recorte
   por semana, pras 23 combinações turma+disciplina do Ensino Médio (EFG) e
   9º ano (CEPI Marajó).

   Existe pra resolver o problema de ter que clicar "criar tema" um por um
   pra cada aula pré-pronta na Gestão — isso aqui aplica o planejamento
   inteiro de uma vez, com um preview obrigatório antes de gravar qualquer
   coisa. Carregado sob demanda pelo botão em Configurações (não no boot
   normal do app) — ver abrirImportarPlano3Bim() no index.html.

   Nunca sobrescreve o que já existe: turma que não está cadastrada vira
   pendência (não cria turma nova); data que já tem uma entrada de
   planejamento é pulada como conflito e reportada; tema já existente
   (mesmo dcgo+nome) é reaproveitado com todo o conteúdo que já tinha. */
const BIM_PLANO_2026 = '3º Bimestre';
const PLANO_3BIM_2026 = [
 {
  "disc": "Filosofia",
  "serie": 1,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Direitos Humanos e dignidade humana: da desigualdade à ação",
    "dcgo": "EM13CHS502",
    "habilidade": "Problematizar formas de desigualdade e identificar ações que promovam os Direitos Humanos.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "O que são Direitos Humanos: da Declaração de 1948 aos dias de hoje"
     },
     {
      "metodologia": "Debate",
      "recorte": "Desigualdade social e racial no Brasil: quem tem dignidade garantida?"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Ações e movimentos que promovem Direitos Humanos (ONGs, coletivos, políticas públicas)"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Debate: dignidade humana é universal ou depende do contexto?"
     }
    ]
   },
   {
    "nome": "Liberdade pública e liberdade privada: a reflexão de Benjamin Constant",
    "dcgo": "GO-EMCHS502C",
    "habilidade": "Refletir sobre liberdade de expressão: filósofos x sofistas; liberdade pública e privada (Constant).",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Sofistas x Sócrates: retórica, verdade e o direito de opinar"
     },
     {
      "metodologia": "Debate",
      "recorte": "Liberdade dos antigos x liberdade dos modernos (Benjamin Constant)"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Liberdade de expressão hoje: redes sociais, discurso de ódio e censura"
     }
    ]
   }
  ]
 },
 {
  "disc": "Filosofia",
  "serie": 1,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Direitos Humanos e dignidade",
    "dcgo": "EM13CHS502",
    "habilidade": "Problematizar formas de desigualdade e identificar ações que promovam os Direitos Humanos.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "O que são Direitos Humanos: da Declaração de 1948 aos dias de hoje"
     },
     {
      "metodologia": "Debate",
      "recorte": "Desigualdade social e racial no Brasil: quem tem dignidade garantida?"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Ações e movimentos que promovem Direitos Humanos (ONGs, coletivos, políticas públicas)"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Debate: dignidade humana é universal ou depende do contexto?"
     }
    ]
   },
   {
    "nome": "Liberdade de expressão",
    "dcgo": "GO-EMCHS502C",
    "habilidade": "Refletir sobre liberdade de expressão: filósofos x sofistas; liberdade pública e privada (Constant).",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Sofistas x Sócrates: retórica, verdade e o direito de opinar"
     },
     {
      "metodologia": "Debate",
      "recorte": "Liberdade dos antigos x liberdade dos modernos (Benjamin Constant)"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Liberdade de expressão hoje: redes sociais, discurso de ódio e censura"
     }
    ]
   }
  ]
 },
 {
  "disc": "Filosofia",
  "serie": 2,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Cultura e poder",
    "dcgo": "EM13CHS205",
    "habilidade": "Avaliar processos culturais e relações de poder na sociedade contemporânea.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "O que é cultura? Popular, erudita e de massa"
     },
     {
      "metodologia": "Debate",
      "recorte": "Cultura como campo de disputa e poder (Gramsci e a hegemonia cultural)"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Culturas afro-brasileiras e indígenas: resistência e protagonismo cultural"
     }
    ]
   },
   {
    "nome": "Indústria cultural (Escola de Frankfurt)",
    "dcgo": "GO-EMCHS205D",
    "habilidade": "Conhecer a Escola de Frankfurt e a indústria cultural (Adorno e Horkheimer).",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": "Escola de Frankfurt: Adorno, Horkheimer e o conceito de indústria cultural"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Padronização, consumo e alienação: cinema, música e redes sociais hoje"
     },
     {
      "metodologia": "Debate",
      "recorte": "Existe resistência possível à indústria cultural?"
     }
    ]
   }
  ]
 },
 {
  "disc": "Filosofia",
  "serie": 2,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Cultura e poder",
    "dcgo": "EM13CHS205",
    "habilidade": "Avaliar processos culturais e relações de poder na sociedade contemporânea.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "O que é cultura? Popular, erudita e de massa"
     },
     {
      "metodologia": "Debate",
      "recorte": "Cultura como campo de disputa e poder (Gramsci e a hegemonia cultural)"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Culturas afro-brasileiras e indígenas: resistência e protagonismo cultural"
     }
    ]
   },
   {
    "nome": "Indústria cultural (Escola de Frankfurt)",
    "dcgo": "GO-EMCHS205D",
    "habilidade": "Conhecer a Escola de Frankfurt e a indústria cultural (Adorno e Horkheimer).",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": "Escola de Frankfurt: Adorno, Horkheimer e o conceito de indústria cultural"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Padronização, consumo e alienação: cinema, música e redes sociais hoje"
     },
     {
      "metodologia": "Debate",
      "recorte": "Existe resistência possível à indústria cultural?"
     }
    ]
   }
  ]
 },
 {
  "disc": "Filosofia",
  "serie": 3,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Princípios dos Direitos Humanos",
    "dcgo": "EM13CHS605",
    "habilidade": "Analisar os princípios da Declaração dos Direitos Humanos (justiça, igualdade, fraternidade).",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "A Declaração Universal dos Direitos Humanos (1948): justiça, igualdade, fraternidade"
     },
     {
      "metodologia": "Debate",
      "recorte": "Direitos Humanos como conquista histórica, não dado natural"
     }
    ]
   },
   {
    "nome": "Direitos naturais (Iluminismo)",
    "dcgo": "GO-EMCHS605A",
    "habilidade": "Entender as origens iluministas dos Direitos Humanos (Locke e Rousseau).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Locke: direitos naturais à vida, liberdade e propriedade"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Rousseau: contrato social e a ideia de igualdade"
     }
    ]
   },
   {
    "nome": "Direitos Humanos: progressos e entraves",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Analisar os princípios da Declaração Universal dos Direitos Humanos, identificando progressos e entraves à sua concretização e refletindo sobre as desigualdades sociais no Mundo Contemporâneo.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Progressos: conquistas de direitos no século XX (mulheres, negros, LGBTQIA+)"
     },
     {
      "metodologia": "Debate",
      "recorte": "Entraves: desigualdade social no mundo contemporâneo"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Estudo de caso: um entrave concreto no Brasil ou em Goiás hoje"
     }
    ]
   }
  ]
 },
 {
  "disc": "Filosofia",
  "serie": 3,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Princípios dos Direitos Humanos",
    "dcgo": "EM13CHS605",
    "habilidade": "Analisar os princípios da Declaração dos Direitos Humanos (justiça, igualdade, fraternidade).",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "A Declaração Universal dos Direitos Humanos (1948): justiça, igualdade, fraternidade"
     },
     {
      "metodologia": "Debate",
      "recorte": "Direitos Humanos como conquista histórica, não dado natural"
     }
    ]
   },
   {
    "nome": "Direitos naturais (Iluminismo)",
    "dcgo": "GO-EMCHS605A",
    "habilidade": "Entender as origens iluministas dos Direitos Humanos (Locke e Rousseau).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Locke: direitos naturais à vida, liberdade e propriedade"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Rousseau: contrato social e a ideia de igualdade"
     }
    ]
   },
   {
    "nome": "Direitos Humanos: progressos e entraves",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Analisar os princípios da Declaração Universal dos Direitos Humanos, identificando progressos e entraves à sua concretização e refletindo sobre as desigualdades sociais no Mundo Contemporâneo.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Progressos: conquistas de direitos no século XX (mulheres, negros, LGBTQIA+)"
     },
     {
      "metodologia": "Debate",
      "recorte": "Entraves: desigualdade social no mundo contemporâneo"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Estudo de caso: um entrave concreto no Brasil ou em Goiás hoje"
     }
    ]
   }
  ]
 },
 {
  "disc": "Filosofia",
  "serie": 3,
  "letra": "C",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Princípios dos Direitos Humanos",
    "dcgo": "EM13CHS605",
    "habilidade": "Analisar os princípios da Declaração dos Direitos Humanos (justiça, igualdade, fraternidade).",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "A Declaração Universal dos Direitos Humanos (1948): justiça, igualdade, fraternidade"
     },
     {
      "metodologia": "Debate",
      "recorte": "Direitos Humanos como conquista histórica, não dado natural"
     }
    ]
   },
   {
    "nome": "Direitos naturais (Iluminismo)",
    "dcgo": "GO-EMCHS605A",
    "habilidade": "Entender as origens iluministas dos Direitos Humanos (Locke e Rousseau).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Locke: direitos naturais à vida, liberdade e propriedade"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Rousseau: contrato social e a ideia de igualdade"
     }
    ]
   },
   {
    "nome": "Direitos Humanos: progressos e entraves",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Analisar os princípios da Declaração Universal dos Direitos Humanos, identificando progressos e entraves à sua concretização e refletindo sobre as desigualdades sociais no Mundo Contemporâneo.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Progressos: conquistas de direitos no século XX (mulheres, negros, LGBTQIA+)"
     },
     {
      "metodologia": "Debate",
      "recorte": "Entraves: desigualdade social no mundo contemporâneo"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Estudo de caso: um entrave concreto no Brasil ou em Goiás hoje  # **História**"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 1,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Identidade e diversidade cultural no tempo e no espaço",
    "dcgo": "EM13CHS104",
    "habilidade": "Analisar objetos e vestígios da cultura material e imaterial de diferentes sociedades.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": "O que é cultura material? Objetos, vestígios e fontes históricas"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Cultura material medieval: castelos, feudos, relíquias religiosas"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Identidade e cultura material afro-brasileira e indígena: o que resta e o que resiste"
     }
    ]
   },
   {
    "nome": "Suserania e vassalagem: as relações de poder",
    "dcgo": "EM13CHS402",
    "habilidade": "Analisar as relações sociais e produtivas do mundo feudal (suserania e vassalagem).",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": "Origens do feudalismo: crise do Império Romano e invasões bárbaras"
     },
     {
      "metodologia": "Debate",
      "recorte": "Suserania e vassalagem: as relações de poder no feudo"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Servos, Igreja e sociedade estamental: quem sustentava o sistema"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 1,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Cultura material e identidade",
    "dcgo": "EM13CHS104",
    "habilidade": "Analisar objetos e vestígios da cultura material e imaterial de diferentes sociedades.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": "O que é cultura material? Objetos, vestígios e fontes históricas"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Cultura material medieval: castelos, feudos, relíquias religiosas"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Identidade e cultura material afro-brasileira e indígena: o que resta e o que resiste"
     }
    ]
   },
   {
    "nome": "Trabalho e vida cotidiana no mundo feudal",
    "dcgo": "EM13CHS402",
    "habilidade": "Analisar as relações sociais e produtivas do mundo feudal (suserania e vassalagem).",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": "Origens do feudalismo: crise do Império Romano e invasões bárbaras"
     },
     {
      "metodologia": "Debate",
      "recorte": "Suserania e vassalagem: as relações de poder no feudo"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Servos, Igreja e sociedade estamental: quem sustentava o sistema"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 2,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Protagonismos indígenas e afrodescendentes",
    "dcgo": "EM13CHS601",
    "habilidade": "Identificar protagonismos de povos indígenas e afrodescendentes no Brasil contemporâneo.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": "Panorama: quem são os protagonistas indígenas e afrodescendentes no Brasil hoje"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Estudos de caso: lideranças e movimentos contemporâneos"
     }
    ]
   },
   {
    "nome": "Escravidão e formação do Brasil",
    "dcgo": "GO-EMCHS601A",
    "habilidade": "Conhecer as origens históricas da desigualdade étnico-racial desde o período colonial.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Resistência indígena e negra",
    "dcgo": "GO-EMCHS601B",
    "habilidade": "Compreender as formas de resistência indígena e negra à escravidão.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Exclusão e inclusão precária no Brasil contemporâneo",
    "dcgo": "GO-EMCHS601C",
    "habilidade": "Analisar as demandas políticas, sociais e culturais dos povos indígenas e das populações afrodescendentes no Brasil contemporâneo, caracterizando o contexto de exclusão e inclusão precária desses grupos na ordem social e econômica atual.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Ações de redução das desigualdades sociais",
    "dcgo": "GO-EMCHS601D",
    "habilidade": "Pesquisar as demandas e protagonismos políticos, sociais e culturais dos povos indígenas e das populações afrodescendentes no Brasil contemporâneo, promovendo ações de redução das desigualdades sociais.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Políticas públicas e ações afirmativas de redução da desigualdade"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Produção dos alunos: proposta de ação/campanha na escola ou comunidade"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 2,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Protagonismos indígenas e afrodescendentes",
    "dcgo": "EM13CHS601",
    "habilidade": "Identificar protagonismos de povos indígenas e afrodescendentes no Brasil contemporâneo.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": "Panorama: quem são os protagonistas indígenas e afrodescendentes no Brasil hoje"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Estudos de caso: lideranças e movimentos contemporâneos"
     }
    ]
   },
   {
    "nome": "Escravidão e formação do Brasil",
    "dcgo": "GO-EMCHS601A",
    "habilidade": "Conhecer as origens históricas da desigualdade étnico-racial desde o período colonial.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Resistência indígena e negra",
    "dcgo": "GO-EMCHS601B",
    "habilidade": "Compreender as formas de resistência indígena e negra à escravidão.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Exclusão e inclusão precária no Brasil contemporâneo",
    "dcgo": "GO-EMCHS601C",
    "habilidade": "Analisar as demandas políticas, sociais e culturais dos povos indígenas e das populações afrodescendentes no Brasil contemporâneo, caracterizando o contexto de exclusão e inclusão precária desses grupos na ordem social e econômica atual.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Ações de redução das desigualdades sociais",
    "dcgo": "GO-EMCHS601D",
    "habilidade": "Pesquisar as demandas e protagonismos políticos, sociais e culturais dos povos indígenas e das populações afrodescendentes no Brasil contemporâneo, promovendo ações de redução das desigualdades sociais.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Políticas públicas e ações afirmativas de redução da desigualdade"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Produção dos alunos: proposta de ação/campanha na escola ou comunidade"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 3,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Política e meio ambiente no Brasil (pós-Vargas)",
    "dcgo": "GO-EMCHS305A",
    "habilidade": "Analisar os governos pós-Era Vargas e as políticas ambientais.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Direitos Humanos e Ditadura Militar",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Analisar os movimentos de defesa dos Direitos Humanos na Ditadura Militar (1964-1985).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "AI-5 (1968) e a institucionalização da repressão: censura, tortura, exílio"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Uma violência desigual: repressão política somada à violência estrutural contra negros e pobres"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Resistência possível: UNE, imprensa alternativa, Comunidades Eclesiais de Base"
     },
     {
      "metodologia": "Debate",
      "recorte": "Anistia de 1979: avanço e ambiguidade (perdão a opositores e a torturadores)"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 3,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Política e meio ambiente no Brasil (pós-Vargas)",
    "dcgo": "GO-EMCHS305A",
    "habilidade": "Analisar os governos pós-Era Vargas e as políticas ambientais.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Direitos Humanos e Ditadura Militar",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Analisar os movimentos de defesa dos Direitos Humanos na Ditadura Militar (1964-1985).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "AI-5 (1968) e a institucionalização da repressão: censura, tortura, exílio"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Uma violência desigual: repressão política somada à violência estrutural contra negros e pobres"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Resistência possível: UNE, imprensa alternativa, Comunidades Eclesiais de Base"
     },
     {
      "metodologia": "Debate",
      "recorte": "Anistia de 1979: avanço e ambiguidade (perdão a opositores e a torturadores)"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 3,
  "letra": "C",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Política e meio ambiente no Brasil (pós-Vargas)",
    "dcgo": "GO-EMCHS305A",
    "habilidade": "Analisar os governos pós-Era Vargas e as políticas ambientais.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Direitos Humanos e Ditadura Militar",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Analisar os movimentos de defesa dos Direitos Humanos na Ditadura Militar (1964-1985).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "AI-5 (1968) e a institucionalização da repressão: censura, tortura, exílio"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Uma violência desigual: repressão política somada à violência estrutural contra negros e pobres"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Resistência possível: UNE, imprensa alternativa, Comunidades Eclesiais de Base"
     },
     {
      "metodologia": "Debate",
      "recorte": "Anistia de 1979: avanço e ambiguidade (perdão a opositores e a torturadores)"
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 9,
  "letra": "A",
  "unidade": "CEPI Marajó",
  "temas": [
   {
    "nome": "Totalitarismos e Segunda Guerra Mundial",
    "dcgo": "GO-EF09HI13-A",
    "habilidade": "Conceituar os regimes totalitários e analisar sua relação com a Segunda Guerra Mundial.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Totalitarismo: nazismo, fascismo e as massas"
     },
     {
      "metodologia": "Debate",
      "recorte": "Racismo de Estado e o Holocausto"
     }
    ]
   },
   {
    "nome": "Populismo e desenvolvimentismo (1946-64)",
    "dcgo": "GO-EF09HI17-A",
    "habilidade": "Analisar os governos populistas e desenvolvimentistas (1946-1964) e seus desdobramentos em Goiás.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Redemocratização de 1945 e a Constituição de 1946"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "JK e os \"50 anos em 5\": a construção de Brasília"
     }
    ]
   },
   {
    "nome": "Ocupação do centro-oeste e construção de Brasília",
    "dcgo": "GO-EF09HI18-A",
    "habilidade": "Identificar o processo de ocupação do centro-oeste brasileiro, a construção de Brasília, e analisar os impactos sobre a região.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Resistência à ditadura: movimentos estudantis, guerrilha, imprensa alternativa e",
    "dcgo": "GO-EF09HI19-A",
    "habilidade": "Compreender a ruptura democrática, a Ditadura Militar e a reabertura.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": "O golpe de 1964: atores e apoios civis-militares"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Anos de chumbo: AI-5, censura, tortura e desaparecimentos"
     }
    ]
   },
   {
    "nome": "Relações de poder e interferências internacionais (1960-80)",
    "dcgo": "GO-EF09HI19-B",
    "habilidade": "Conhecer e analisar as diversas relações de poder e interferências internacionais na situação política e econômica no Brasil, nas décadas de 1960 a 1980.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Contestação e resistência nos anos 1960",
    "dcgo": "GO-EF09HI19-C",
    "habilidade": "Identificar as mudanças sociais, culturais e políticas nos anos de 1960, analisando os elementos de contestação da ordem estabelecida, bem como os processos de resistência durante a ditadura civil-militar.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Questão indígena durante a ditadura",
    "dcgo": "GO-EF09HI21-A",
    "habilidade": "Analisar a questão indígena durante a ditadura militar, relacionando a questão da terra, das \"grandes obras\" e da FUNAI aos movimentos de luta e contestação dos indígenas nesse período e na atualidade.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Racismo e resistência negra na ditadura",
    "dcgo": "GO-EF09HI21-B",
    "habilidade": "Identificar, no contexto da ditadura civil-militar, as manifestações de racismo, repressão, perseguição e discriminação aos grupos negros, na cidade e no campo, e as resistências do movimento negro.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Anistia de 1979",
    "dcgo": "GO-EF09HI22-A",
    "habilidade": "Problematizar e analisar a política de conciliação por meio da Anistia de 1979, compreendendo questões relacionadas ao tema na atualidade.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Goiás na década de 1980",
    "dcgo": "GO-EF09HI22-B",
    "habilidade": "Analisar o contexto sócio-político, econômico e cultural da sociedade goianiense na década de 1980, destacando sua participação na política nacional.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "O acidente do Césio-137 em Goiânia",
    "dcgo": "GO-EF09HI22-C",
    "habilidade": "Conhecer e analisar o acidente com o Césio-137 em Goiânia e sua relação com a promoção da cidadania, com repercussões locais, nacionais e internacionais.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Lutas por igualdade e políticas afirmativas",
    "dcgo": "GO-EF09HI26-A",
    "habilidade": "Conhecer e problematizar as lutas por igualdade de direito de populações marginalizadas, discutindo políticas públicas afirmativas contra todo tipo de violência.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Movimentos contra feminicídio, racismo e homofobia",
    "dcgo": "GO-EF09HI26-B",
    "habilidade": "Analisar e problematizar as lutas e os movimentos da sociedade brasileira contra o feminicídio, o machismo, a homofobia, o racismo e o bullying na contemporaneidade.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Mídias digitais e cultura de massas",
    "dcgo": "GO-EF09HI27-A",
    "habilidade": "Compreender e problematizar o uso das mídias digitais na contemporaneidade, a partir do conceito de cultura de massas e sua relação com o capitalismo e a lógica consumista.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   }
  ]
 },
 {
  "disc": "História",
  "serie": 9,
  "letra": "C",
  "unidade": "CEPI Marajó",
  "temas": [
   {
    "nome": "Totalitarismo: nazismo, fascismo e as massas",
    "dcgo": "GO-EF09HI13-A",
    "habilidade": "Conceituar os regimes totalitários e analisar sua relação com a Segunda Guerra Mundial.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Totalitarismo: nazismo, fascismo e as massas"
     },
     {
      "metodologia": "Debate",
      "recorte": "Racismo de Estado e o Holocausto"
     }
    ]
   },
   {
    "nome": "Populismo e desenvolvimentismo (1946-64)",
    "dcgo": "GO-EF09HI17-A",
    "habilidade": "Analisar os governos populistas e desenvolvimentistas (1946-1964) e seus desdobramentos em Goiás.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Redemocratização de 1945 e a Constituição de 1946"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "JK e os \"50 anos em 5\": a construção de Brasília"
     }
    ]
   },
   {
    "nome": "Ocupação do centro-oeste e construção de Brasília",
    "dcgo": "GO-EF09HI18-A",
    "habilidade": "Identificar o processo de ocupação do centro-oeste brasileiro, a construção de Brasília, e analisar os impactos sobre a região.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Resistência à ditadura: movimentos estudantis, guerrilha, imprensa alternativa e",
    "dcgo": "GO-EF09HI19-A",
    "habilidade": "Compreender a ruptura democrática, a Ditadura Militar e a reabertura.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": "O golpe de 1964: atores e apoios civis-militares"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Anos de chumbo: AI-5, censura, tortura e desaparecimentos"
     }
    ]
   },
   {
    "nome": "Relações de poder e interferências internacionais (1960-80)",
    "dcgo": "GO-EF09HI19-B",
    "habilidade": "Conhecer e analisar as diversas relações de poder e interferências internacionais na situação política e econômica no Brasil, nas décadas de 1960 a 1980.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Contestação e resistência nos anos 1960",
    "dcgo": "GO-EF09HI19-C",
    "habilidade": "Identificar as mudanças sociais, culturais e políticas nos anos de 1960, analisando os elementos de contestação da ordem estabelecida, bem como os processos de resistência durante a ditadura civil-militar.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Questão indígena durante a ditadura",
    "dcgo": "GO-EF09HI21-A",
    "habilidade": "Analisar a questão indígena durante a ditadura militar, relacionando a questão da terra, das \"grandes obras\" e da FUNAI aos movimentos de luta e contestação dos indígenas nesse período e na atualidade.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Racismo e resistência negra na ditadura",
    "dcgo": "GO-EF09HI21-B",
    "habilidade": "Identificar, no contexto da ditadura civil-militar, as manifestações de racismo, repressão, perseguição e discriminação aos grupos negros, na cidade e no campo, e as resistências do movimento negro.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Anistia de 1979",
    "dcgo": "GO-EF09HI22-A",
    "habilidade": "Problematizar e analisar a política de conciliação por meio da Anistia de 1979, compreendendo questões relacionadas ao tema na atualidade.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Goiás na década de 1980",
    "dcgo": "GO-EF09HI22-B",
    "habilidade": "Analisar o contexto sócio-político, econômico e cultural da sociedade goianiense na década de 1980, destacando sua participação na política nacional.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "O acidente do Césio-137 em Goiânia",
    "dcgo": "GO-EF09HI22-C",
    "habilidade": "Conhecer e analisar o acidente com o Césio-137 em Goiânia e sua relação com a promoção da cidadania, com repercussões locais, nacionais e internacionais.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Lutas por igualdade e políticas afirmativas",
    "dcgo": "GO-EF09HI26-A",
    "habilidade": "Conhecer e problematizar as lutas por igualdade de direito de populações marginalizadas, discutindo políticas públicas afirmativas contra todo tipo de violência.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Movimentos contra feminicídio, racismo e homofobia",
    "dcgo": "GO-EF09HI26-B",
    "habilidade": "Analisar e problematizar as lutas e os movimentos da sociedade brasileira contra o feminicídio, o machismo, a homofobia, o racismo e o bullying na contemporaneidade.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Mídias digitais e cultura de massas",
    "dcgo": "GO-EF09HI27-A",
    "habilidade": "Compreender e problematizar o uso das mídias digitais na contemporaneidade, a partir do conceito de cultura de massas e sua relação com o capitalismo e a lógica consumista.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)\n\n# **Sociologia**",
      "recorte": ""
     }
    ]
   }
  ]
 },
 {
  "disc": "Sociologia",
  "serie": 1,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "O modo de produção capitalista: mercadoria, valor e mais-valia",
    "dcgo": "GO-EMCHS402A",
    "habilidade": "Compreender o capitalismo, a mais-valia e a teoria do valor (Marx).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "agrupado nesta aula"
     }
    ]
   },
   {
    "nome": "Taylorismo e Fordismo",
    "dcgo": "GO-EMCHS402B",
    "habilidade": "Diferenciar as formas de produção em série, linha de montagem e de produtos mais homogêneos, relacionando-as ao desenvolvimento tecnológico, às mudanças no mundo do trabalho e ao avanço da globalização.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": "agrupado nesta aula"
     }
    ]
   },
   {
    "nome": "Concentração de renda e desigualdade social",
    "dcgo": "GO-EMCHS402C",
    "habilidade": "Analisar a concentração de renda como um dos principais fatores de manutenção da desigualdade social no Brasil, comparando indicadores de instituições oficiais.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Trabalho rural e urbano",
    "dcgo": "GO-EMCHS402D",
    "habilidade": "Pesquisar aspectos do trabalho rural e urbano, comparando características e dados (textos, mapas, gráficos e estatísticas do IBGE) para avaliar as relações de poder no mundo do trabalho.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Mundo do trabalho contemporâneo",
    "dcgo": "GO-EMCHS403A",
    "habilidade": "Compreender as novas formas de trabalho (uberização, plataformização, precarização).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Tecnologia e empregabilidade",
    "dcgo": "GO-EMCHS403B",
    "habilidade": "Compreender os impactos do desenvolvimento tecnológico na organização do mundo do trabalho e na organização espacial, examinando a empregabilidade no contexto das tecnologias e da globalização.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Trabalho intelectual e manual",
    "dcgo": "GO-EMCHS403C",
    "habilidade": "Reconhecer as formas de trabalho intelectual e manual, utilizando textos científicos, literários e jornalísticos para analisar as transformações no mundo do trabalho.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Reforma trabalhista",
    "dcgo": "GO-EMCHS403D",
    "habilidade": "Analisar os principais pontos da reforma trabalhista, contextualizando os novos arranjos possibilitados pela legislação e seu impacto na vida dos/as trabalhadores/as.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   }
  ]
 },
 {
  "disc": "Sociologia",
  "serie": 1,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Capitalismo e trabalho",
    "dcgo": "GO-EMCHS402A",
    "habilidade": "Compreender o capitalismo, a mais-valia e a teoria do valor (Marx).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "agrupado nesta aula"
     }
    ]
   },
   {
    "nome": "Taylorismo e Fordismo",
    "dcgo": "GO-EMCHS402B",
    "habilidade": "Diferenciar as formas de produção em série, linha de montagem e de produtos mais homogêneos, relacionando-as ao desenvolvimento tecnológico, às mudanças no mundo do trabalho e ao avanço da globalização.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": "agrupado nesta aula"
     }
    ]
   },
   {
    "nome": "Concentração de renda e desigualdade social",
    "dcgo": "GO-EMCHS402C",
    "habilidade": "Analisar a concentração de renda como um dos principais fatores de manutenção da desigualdade social no Brasil, comparando indicadores de instituições oficiais.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Trabalho rural e urbano",
    "dcgo": "GO-EMCHS402D",
    "habilidade": "Pesquisar aspectos do trabalho rural e urbano, comparando características e dados (textos, mapas, gráficos e estatísticas do IBGE) para avaliar as relações de poder no mundo do trabalho.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Mundo do trabalho contemporâneo",
    "dcgo": "GO-EMCHS403A",
    "habilidade": "Compreender as novas formas de trabalho (uberização, plataformização, precarização).",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Tecnologia e empregabilidade",
    "dcgo": "GO-EMCHS403B",
    "habilidade": "Compreender os impactos do desenvolvimento tecnológico na organização do mundo do trabalho e na organização espacial, examinando a empregabilidade no contexto das tecnologias e da globalização.",
    "aulas": [
     {
      "metodologia": "Pesquisa",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Trabalho intelectual e manual",
    "dcgo": "GO-EMCHS403C",
    "habilidade": "Reconhecer as formas de trabalho intelectual e manual, utilizando textos científicos, literários e jornalísticos para analisar as transformações no mundo do trabalho.",
    "aulas": [
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": ""
     }
    ]
   },
   {
    "nome": "Reforma trabalhista",
    "dcgo": "GO-EMCHS403D",
    "habilidade": "Analisar os principais pontos da reforma trabalhista, contextualizando os novos arranjos possibilitados pela legislação e seu impacto na vida dos/as trabalhadores/as.",
    "aulas": [
     {
      "metodologia": "Debate",
      "recorte": ""
     }
    ]
   }
  ]
 },
 {
  "disc": "Sociologia",
  "serie": 2,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Conflitos sociais no Brasil contemporâneo",
    "dcgo": "GO-EMCHS205C",
    "habilidade": "Debater conflitos sociais, intolerância, racismo e desigualdade no Brasil contemporâneo.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "O que é conflito social: disputa entre grupos desiguais, motor de mudança (não \"caos\")"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Racismo estrutural no Brasil (Silvio Almeida): trabalho, segurança pública, saúde"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Intolerância religiosa contra religiões de matriz africana (Candomblé, Umbanda)"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Desigualdade de renda como herança da escravidão e da ausência de reparação histórica"
     }
    ]
   }
  ]
 },
 {
  "disc": "Sociologia",
  "serie": 2,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Conflitos sociais no Brasil contemporâneo",
    "dcgo": "GO-EMCHS205C",
    "habilidade": "Debater conflitos sociais, intolerância, racismo e desigualdade no Brasil contemporâneo.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "O que é conflito social: disputa entre grupos desiguais, motor de mudança (não \"caos\")"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Racismo estrutural no Brasil (Silvio Almeida): trabalho, segurança pública, saúde"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Intolerância religiosa contra religiões de matriz africana (Candomblé, Umbanda)"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Desigualdade de renda como herança da escravidão e da ausência de reparação histórica"
     }
    ]
   }
  ]
 },
 {
  "disc": "Sociologia",
  "serie": 3,
  "letra": "A",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Direitos Humanos no século XXI",
    "dcgo": "EM13CHS605",
    "habilidade": "Analisar a aplicação dos Direitos Humanos na realidade do século XXI.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "DUDH (1948): origem, princípios e o contexto do pós-guerra/Holocausto"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Crise migratória global: refugiados e o direito de asilo na prática"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Era digital: vigilância, algoritmos e discriminação (reconhecimento facial)"
     }
    ]
   },
   {
    "nome": "Democracia e movimentos sociais",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Refletir sobre democracia e movimentos sociais na garantia dos Direitos Humanos.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": "Democracia representativa x participativa: votar não basta"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "O que é um movimento social (organização, estratégia, liderança — não \"bagunça\")"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Panorama dos movimentos sociais brasileiros: negro, sindical, feminista, LGBTQIA+, indígena, moradia (MST/MTST)"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "De movimento a lei: Maria da Penha, cotas raciais e o debate do Marco Temporal"
     }
    ]
   }
  ]
 },
 {
  "disc": "Sociologia",
  "serie": 3,
  "letra": "B",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Direitos Humanos no século XXI",
    "dcgo": "EM13CHS605",
    "habilidade": "Analisar a aplicação dos Direitos Humanos na realidade do século XXI.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "DUDH (1948): origem, princípios e o contexto do pós-guerra/Holocausto"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Crise migratória global: refugiados e o direito de asilo na prática"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Era digital: vigilância, algoritmos e discriminação (reconhecimento facial)"
     },
     {
      "metodologia": "Exibição de filme",
      "recorte": "Desigualdade global: direitos sociais básicos ainda não garantidos"
     }
    ]
   },
   {
    "nome": "Democracia e movimentos sociais",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Refletir sobre democracia e movimentos sociais na garantia dos Direitos Humanos.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "Democracia representativa x participativa: votar não basta"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "O que é um movimento social (organização, estratégia, liderança — não \"bagunça\")"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Panorama dos movimentos sociais brasileiros: negro, sindical, feminista, LGBTQIA+, indígena, moradia (MST/MTST)"
     },
     {
      "metodologia": "Debate",
      "recorte": "De movimento a lei: Maria da Penha, cotas raciais e o debate do Marco Temporal"
     }
    ]
   }
  ]
 },
 {
  "disc": "Sociologia",
  "serie": 3,
  "letra": "C",
  "unidade": "EFG",
  "temas": [
   {
    "nome": "Direitos Humanos no século XXI",
    "dcgo": "EM13CHS605",
    "habilidade": "Analisar a aplicação dos Direitos Humanos na realidade do século XXI.",
    "aulas": [
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "DUDH (1948): origem, princípios e o contexto do pós-guerra/Holocausto"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Crise migratória global: refugiados e o direito de asilo na prática"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "Era digital: vigilância, algoritmos e discriminação (reconhecimento facial)"
     }
    ]
   },
   {
    "nome": "Democracia e movimentos sociais",
    "dcgo": "GO-EMCHS605B",
    "habilidade": "Refletir sobre democracia e movimentos sociais na garantia dos Direitos Humanos.",
    "aulas": [
     {
      "metodologia": "Exibição de filme",
      "recorte": "Democracia representativa x participativa: votar não basta"
     },
     {
      "metodologia": "Livro didático (páginas a definir)",
      "recorte": "O que é um movimento social (organização, estratégia, liderança — não \"bagunça\")"
     },
     {
      "metodologia": "Pesquisa",
      "recorte": "Panorama dos movimentos sociais brasileiros: negro, sindical, feminista, LGBTQIA+, indígena, moradia (MST/MTST)"
     },
     {
      "metodologia": "Aula expositiva (texto/slide)",
      "recorte": "De movimento a lei: Maria da Penha, cotas raciais e o debate do Marco Temporal"
     }
    ]
   }
  ]
 }
];

/* ---------- Importador (preview obrigatório antes de gravar) ---------- */

/* Monta o plano inteiro em memória, sem persistir nada — usado tanto pro
   preview quanto (com o mesmo resultado, cacheado) pra gravação de fato,
   assim o que ela vê no preview é exatamente o que é gravado depois. */
function prepararImportacaoPlano3Bim(){
  const bim = BIM_PLANO_2026;
  const plano = {
    turmasCriadas: [],       // objetos turma novos, prontos pra inserir (ela pediu pra criar em vez de só listar)
    temasNovos: [],          // objetos tema completos, prontos pra inserir
    temasReaproveitados: [], // {id,nome,dcgo,turmaNome}
    temasSemPrebuilt: [],    // subconjunto de temasNovos sem conteúdo pré-pronto encontrado
    conflitos: [],           // {turmaNome,data,existente:{metodologia,obs,temaNome}}
    novosConteudos: {},      // id -> conteudo (só os que acabam sendo usados)
    entriesPorConteudo: {},  // conteudoId -> [entry,...]
    totalAulas: 0
  };
  const ordemPorConteudo = {};

  PLANO_3BIM_2026.forEach(turmaPlano=>{
    const { disc, serie, letra, unidade, temas: temasPlano } = turmaPlano;
    // turma.serie é guardado como o rótulo por extenso ("1ª série EM", "9º
    // ano" — ver addTurma()/SCHEDULE), não o número puro que o documento usa
    // internamente pra ordenar; SERIE_NUM (já global, definido no index.html
    // pra cruzar com o SCHEDULE) faz essa conversão.
    const serieLabel = SERIE_NUM[serie] || serie;
    let turma = Object.values(turmas).find(t=>t && t.disciplina===disc && t.serie===serieLabel && (t.letra||'')===letra && t.unidade===unidade);
    if(!turma){
      // só existe dentro do plano até a confirmação — datasDoBimestre() recebe
      // o objeto direto, não precisa estar no mapa global turmas pra funcionar,
      // então o preview nunca "vaza" uma turma fantasma pro resto do app.
      turma = {id:uid(), disciplina:disc, unidade, serie:serieLabel, letra, updatedAt:Date.now()};
      turma.nome = turmaNome(turma);
      plano.turmasCriadas.push(turma);
    }

    // datas candidatas: bimestre inteiro (não só daqui pra frente), na ordem
    const candidatas = datasDoBimestre(turma, bim);
    // datas já ocupadas por QUALQUER entrada de planejamento desta turma neste bimestre
    const usadas = new Set();
    Object.values(conteudos).filter(c=>c && c.turmaId===turma.id && c.bimestre===bim).forEach(c=>{
      (c.planejamento||[]).forEach(p=>usadas.add(p.data));
    });
    const livres = candidatas.filter(d=>!usadas.has(d));

    // conteúdo "Matriz — {bim}" já existente (só leitura — não cria aqui)
    let contMatriz = Object.values(conteudos).find(c=>c && c.turmaId===turma.id && c.bimestre===bim && c.nome==='Matriz — '+bim);

    temasPlano.forEach(temaPlano=>{
      // reaproveita tema já existente com mesmo dcgo+nome nesta turma/bimestre
      let temaExistente = Object.values(temas).find(t=>t && t.turmaId===turma.id && t.bimestre===bim && t.dcgo===temaPlano.dcgo && t.nome===temaPlano.nome.slice(0,80));
      let temaId, conteudoAlvoId;

      if(temaExistente){
        temaId = temaExistente.id;
        conteudoAlvoId = temaExistente.conteudoId;
        plano.temasReaproveitados.push({id:temaId, nome:temaExistente.nome, dcgo:temaExistente.dcgo, turmaNome: turmaNome(turma)});
      } else {
        // precisa do conteúdo "Matriz" pra acolher o tema novo — cria (só no plano) se ainda não existir
        if(!contMatriz){
          const chave = 'novo:'+turma.id;
          if(!plano.novosConteudos[chave]){
            plano.novosConteudos[chave] = {id:uid(), disciplina:disc, serie:serieLabel, turmaId:turma.id, bimestre:bim, nome:'Matriz — '+bim, resumo:'', ordem:0, updatedAt:Date.now()};
          }
          contMatriz = plano.novosConteudos[chave];
        }
        conteudoAlvoId = contMatriz.id;
        if(ordemPorConteudo[conteudoAlvoId]===undefined){
          ordemPorConteudo[conteudoAlvoId] = conteudos[conteudoAlvoId] ? nextOrdemTema(conteudoAlvoId) : 0;
        }
        const novoTema = blankTema(conteudoAlvoId, {
          turmaId: turma.id, disciplina: disc, serie: serieLabel, bimestre: bim,
          nome: temaPlano.nome.slice(0,80), dcgo: temaPlano.dcgo,
          habilidade: temaPlano.habilidade, resumo: temaPlano.habilidade,
          ordem: ordemPorConteudo[conteudoAlvoId]++
        });
        if(!applyPrebuiltIfEmptySilent(novoTema)) plano.temasSemPrebuilt.push({nome:novoTema.nome, dcgo:novoTema.dcgo, turmaNome:turmaNome(turma)});
        plano.temasNovos.push(novoTema);
        temaId = novoTema.id;
      }

      temaPlano.aulas.forEach(aula=>{
        const data = livres.shift();
        if(!data){
          plano.conflitos.push({turmaNome:turmaNome(turma), data:'(sem data livre sobrando)', existente:{metodologia:aula.metodologia, obs:aula.recorte, temaNome:temaPlano.nome}});
          return;
        }
        const entry = {id:uid(), data, temaId, objeto:'quadro', metodologia:aula.metodologia, obs:aula.recorte};
        (plano.entriesPorConteudo[conteudoAlvoId]||(plano.entriesPorConteudo[conteudoAlvoId]=[])).push(entry);
        plano.totalAulas++;
      });
    });

    // datas que sobraram sem par (mais datas livres do que aulas no plano) não geram nada — só não usa
  });

  return plano;
}

let _planoImportCache = null;

function abrirImportarPlano3Bim(){
  if(typeof ensurePrebuiltDiscLoaded==='undefined'){ toast('Carregando o app ainda — tente de novo em alguns segundos.','err'); return; }
  toast('Preparando preview…','');
  Promise.all(['Filosofia','História','Sociologia'].map(ensurePrebuiltDiscLoaded)).then(()=>{
    _planoImportCache = prepararImportacaoPlano3Bim();
    renderPreviewImportacaoPlano3Bim(_planoImportCache);
  });
}

function renderPreviewImportacaoPlano3Bim(plano){
  const li = (arr, fn) => arr.length ? '<ul style="margin:4px 0 0;padding-left:18px;font-size:12.5px;color:var(--muted)">'+arr.map(fn).join('')+'</ul>' : '';
  let html = '<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-width:560px">'+
    '<div class="modal-h"><h3>📋 Importar planejamento do 3º Bimestre — preview</h3></div>'+
    '<div class="modal-b">'+
    '<p>'+(plano.turmasCriadas.length?('<b>'+plano.turmasCriadas.length+'</b> turma(s) nova(s) · '):'')+'<b>'+plano.temasNovos.length+'</b> tema(s) novo(s) · <b>'+plano.temasReaproveitados.length+'</b> reaproveitado(s) · <b>'+plano.totalAulas+'</b> aula(s) de planejamento a criar.</p>';

  if(plano.temasSemPrebuilt.length){
    html += '<div class="field"><label>⚠ Sem conteúdo pré-pronto ainda ('+plano.temasSemPrebuilt.length+') — tema é criado vazio, precisa de conteúdo depois</label>'+
      li(plano.temasSemPrebuilt, x=>'<li>'+esc(x.turmaNome)+' — '+esc(x.nome)+' ['+esc(x.dcgo)+']</li>')+'</div>';
  }
  if(plano.turmasCriadas.length){
    html += '<div class="field"><label>➕ Turmas novas, que ainda não existiam no Leciona ('+plano.turmasCriadas.length+') — vão ser criadas junto</label>'+
      li(plano.turmasCriadas, x=>'<li>'+esc(turmaNome(x))+'</li>')+'</div>';
  }
  if(plano.conflitos.length){
    html += '<div class="field"><label>⚠ Aulas do documento sem data livre sobrando ('+plano.conflitos.length+') — não foram agendadas</label>'+
      li(plano.conflitos, x=>'<li>'+esc(x.turmaNome)+' — '+esc(x.existente.temaNome)+' ('+esc(x.existente.metodologia)+')</li>')+'</div>';
  }
  html += '<p style="font-size:12.5px;color:var(--muted)">Nada é gravado agora. Datas que já têm uma aula planejada não são alteradas. Temas que já existem mantêm todo o conteúdo que já tinham — só entram como reaproveitados.</p>';
  html += '</div><div class="modal-f"><button class="btn ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn primary" onclick="confirmarImportacaoPlano3Bim()">Confirmar e gravar</button></div></div></div>';
  abrirModal(html);
}

function confirmarImportacaoPlano3Bim(){
  const plano = _planoImportCache;
  if(!plano){ toast('Preview expirou — abra de novo.','err'); return; }
  closeModal();

  const updates = {};
  plano.turmasCriadas.forEach(tu=>{ turmas[tu.id]=tu; updates['leciona/turmas/'+tu.id]=tu; });
  Object.values(plano.novosConteudos).forEach(c=>{ conteudos[c.id]=c; updates['leciona/conteudos/'+c.id]=c; });
  plano.temasNovos.forEach(t=>{ temas[t.id]=t; updates['leciona/temas/'+t.id]=t; });

  const conteudosTocados = new Set(Object.keys(plano.entriesPorConteudo));
  conteudosTocados.forEach(cid=>{
    const c = conteudos[cid];
    if(!c) return; // não deveria acontecer — segurança
    if(!c.planejamento) c.planejamento=[];
    c.planejamento.push(...plano.entriesPorConteudo[cid]);
    c.updatedAt = Date.now();
    updates['leciona/conteudos/'+c.id] = c;
  });

  _temaIdx = null;
  if(plano.turmasCriadas.length) lsSet(LS_TURMAS, JSON.stringify(turmas));
  lsSet(LS_CONT, JSON.stringify(conteudos));
  lsSet(LS_TEMAS, JSON.stringify(temas));
  if(DB && Object.keys(updates).length){
    DB.ref().update(updates).catch(e=>toast('⚠ Gravado localmente, mas falhou ao sincronizar com o Firebase: '+e.message,'err'));
  }

  if(plano.turmasCriadas.length && typeof refreshTurmas==='function') refreshTurmas();
  renderThemes();
  if(document.getElementById('viewLinhaTempo') && !document.getElementById('viewLinhaTempo').classList.contains('hidden')) renderLinhaDoTempo();
  toast('Planejamento do 3º bimestre importado: '+(plano.turmasCriadas.length?(plano.turmasCriadas.length+' turma(s) nova(s), '):'')+plano.temasNovos.length+' tema(s) novo(s), '+plano.totalAulas+' aula(s) agendada(s).', 'ok');
  _planoImportCache = null;
}
