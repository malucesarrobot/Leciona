/* catalog.js — Leciona
   Catálogo de subtemas por disciplina, série e bimestre.
   Carregado uma vez via <script src="catalog.js">.
   NÃO editar manualmente — gerado a partir da matriz DC-GO/BNCC.
*/
const SUBTEMAS = {
  /* ----- 9º · 1º BIMESTRE ----- */
  'EF09HI01':[
    {s:'Crise do Império e queda da Monarquia',a:1},
    {s:'15/11/1889: golpe militar e o "povo bestializado"',a:1},
    {s:'A República que excluiu negros, mulheres e analfabetos',a:1},
    {s:'Símbolos e mitos republicanos (positivismo, Tiradentes)',a:1},
    {s:'Proclamação da República e seus primeiros desdobramentos',a:1}
  ],
  'GO-EF09HI03-A':[
    {s:'Lei de Terras de 1850: a terra vira mercadoria',a:1},
    {s:'Barrar o acesso de negros libertos e pobres à terra',a:1},
    {s:'Concentração fundiária e suas heranças em Goiás',a:1}
  ],
  'GO-EF09HI02-A':[
    {s:'Política dos governadores e o "café com leite"',a:1},
    {s:'Coronelismo e voto de cabresto',a:1},
    {s:'Oligarquias em Goiás (Bulhões e Caiado)',a:1},
    {s:'Quem mandava e quem era excluído da política',a:1},
    {s:'Os ciclos da história republicana até 1954',a:1}
  ],
  'GO-EF09HI03-C':[
    {s:'1888: abolição sem terra, trabalho ou reparação',a:1},
    {s:'Racismo de Estado: teorias raciais e branqueamento',a:1},
    {s:'Resistência negra: imprensa, clubes e matriz africana',a:1},
    {s:'Heranças da escravidão na desigualdade de hoje',a:1},
    {s:'A questão da inserção dos negros no período republicano pós-abolição',a:1}
  ],
  'GO-EF09HI05-D':[
    {s:'Revolta da Vacina (1904): ciência e autoritarismo',a:1},
    {s:'Revolta da Chibata (1910): João Cândido e a Marinha negra',a:1},
    {s:'Canudos e Contestado: sertão, fé e a República contra os pobres',a:2},
    {s:'Cangaço como resistência social no Nordeste',a:1},
    {s:'Urbanização e modernização da sociedade brasileira',a:1}
  ],
  /* ----- 9º · 2º BIMESTRE ----- */
  'GO-EF09HI06-A':[
    {s:'Revolução de 1930 e o fim da República Velha',a:1},
    {s:'Trabalhismo e CLT (1943): direitos e controle',a:1},
    {s:'Estado Novo (1937): ditadura, censura e culto a Vargas',a:1},
    {s:'O "pai dos pobres": propaganda x realidade',a:1},
    {s:'O papel do trabalhismo como força política, social e cultural',a:1}
  ],
  'GO-EF09HI06-B':[
    {s:'Marcha para o Oeste e a interiorização',a:1},
    {s:'Construção de Goiânia (1933): cidade planejada',a:1},
    {s:'Impactos sobre indígenas e camponeses do interior',a:1}
  ],
  'EF09HI07':[
    {s:'As pautas dos povos indígenas e das populações afrodescendentes no contexto republicano (até 1964)',a:1}
  ],
  'EF09HI08':[
    {s:'Diversidade no Brasil do século XX',a:1}
  ],
  'EF09HI09':[
    {s:'Movimentos sociais e conquistas de direitos',a:1}
  ],
  'GO-EF09HI10-A':[
    {s:'O que é imperialismo: a corrida por colônias',a:1},
    {s:'Partilha da África (Conferência de Berlim, 1884-85)',a:1},
    {s:'Resistências africanas e asiáticas ao domínio europeu',a:1},
    {s:'Racismo científico como justificativa do imperialismo',a:1},
    {s:'Dinâmicas do capitalismo, suas crises e os grandes conflitos europeus',a:1}
  ],
  'GO-EF09HI10-C':[
    {s:'Causas: imperialismo, alianças e nacionalismo',a:1},
    {s:'A guerra de trincheiras e a vida dos soldados',a:1},
    {s:'Tropas coloniais: africanos e asiáticos na guerra europeia',a:1},
    {s:'Tratado de Versalhes e as sementes de novos conflitos',a:1}
  ],
  'EF09HI11':[
    {s:'A Rússia czarista: atraso e desigualdade',a:1},
    {s:'1917: as revoluções de fevereiro e outubro',a:1},
    {s:'Do sonho socialista ao stalinismo',a:1},
    {s:'As especificidades e os desdobramentos mundiais da Revolução Russa',a:1}
  ],
  'EF09HI12':[
    {s:'Os anos 1920 e a quebra da Bolsa de Nova York',a:1},
    {s:'Efeitos no mundo e no Brasil (a crise do café)',a:1},
    {s:'New Deal: o novo papel do Estado na economia',a:1},
    {s:'A crise capitalista de 1929 e seus desdobramentos na economia global',a:1}
  ],
  /* ----- 9º · 3º BIMESTRE ----- */
  'GO-EF09HI13-A':[
    {s:'Totalitarismo: nazismo, fascismo e as massas',a:1},
    {s:'Racismo de Estado e o Holocausto',a:1},
    {s:'A Segunda Guerra Mundial: frentes, viradas e fim',a:2},
    {s:'Tropas coloniais e a FEB: o esforço negro e latino na guerra',a:1},
    {s:'Bomba atômica e o novo medo do mundo',a:1},
    {s:'A emergência do fascismo e do nazismo, os estados totalitários e as práticas de extermínio',a:1}
  ],
  'EF09HI14':[
    {s:'As dinâmicas do colonialismo no continente africano e asiático e as lógicas de resistência das populações locais',a:1}
  ],
  'EF09HI15':[
    {s:'As motivações para a criação da Organização das Nações Unidas (ONU)',a:1}
  ],
  'EF09HI16':[
    {s:'A Carta dos Direitos Humanos e o processo de afirmação dos direitos fundamentais',a:1}
  ],
  'GO-EF09HI17-A':[
    {s:'Redemocratização de 1945 e a Constituição de 1946',a:1},
    {s:'JK e os "50 anos em 5": a construção de Brasília',a:2},
    {s:'Jango e as Reformas de Base',a:1},
    {s:'Goiás e a marcha desenvolvimentista no Planalto Central',a:1},
    {s:'Processos sociais, econômicos, culturais e políticos do Brasil a partir de 1946',a:1}
  ],
  'EF09HI18':[
    {s:'Transformações urbanas, cultura brasileira e desigualdades regionais (1946-1964)',a:1}
  ],
  'GO-EF09HI19-A':[
    {s:'O golpe de 1964: atores e apoios civis-militares',a:1},
    {s:'Anos de chumbo: AI-5, censura, tortura e desaparecimentos',a:1},
    {s:'"Milagre econômico" x arrocho e concentração de renda',a:1},
    {s:'Resistências: estudantes, artistas, Igreja e mulheres',a:1},
    {s:'Anistia, Diretas Já e heranças no presente',a:1},
    {s:'O processo que resultou na ditadura civil-militar no Brasil',a:1},
    {s:'O golpe de 1964 e a ditadura militar',a:1},
    {s:'O milagre econômico e o arrocho salarial',a:1},
    {s:'A abertura política e as Diretas Já',a:1}
  ],
  /* ----- 9º · 4º BIMESTRE -----
     Fonte: Historia_9ano-1.epub (produção terceirizada), códigos conferidos
     um a um contra a BNCC oficial (habilidades EF09HI17 a EF09HI36). */
  'EF09HI20':[
    {s:'Resistência e memória: violações de direitos humanos durante a ditadura civil-militar',a:1}
  ],
  'EF09HI21':[
    {s:'Demandas indígenas e quilombolas como forma de contestação ao modelo desenvolvimentista da ditadura',a:1}
  ],
  'EF09HI22':[
    {s:'Mobilização da sociedade brasileira do final do período ditatorial até a Constituição de 1988',a:1}
  ],
  'EF09HI23':[
    {s:'A Constituição de 1988 e a noção de cidadania',a:1},
    {s:'A Constituição de 1988 — a Constituição Cidadã',a:1}
  ],
  'EF09HI28':[
    {s:'A Guerra Fria: confrontos de dois modelos políticos e as tensões geopolíticas',a:1}
  ],
  'EF09HI29':[
    {s:'As experiências ditatoriais na América Latina',a:1}
  ],
  'EF09HI31':[
    {s:'Os processos de descolonização na África e na Ásia',a:1}
  ],
  /* Este subtema cobre duas habilidades ao mesmo tempo (globalização + políticas
     econômicas na América Latina) — registrado nas duas chaves por instrução da Malu. */
  'EF09HI32':[
    {s:'O fim da Guerra Fria, o processo de globalização e as políticas econômicas na América Latina',a:1}
  ],
  'EF09HI34':[
    {s:'O fim da Guerra Fria, o processo de globalização e as políticas econômicas na América Latina',a:1}
  ],
  'EF09HI35':[
    {s:'Os conflitos do século XXI e a questão do terrorismo',a:1}
  ],
  'EF09HI36':[
    {s:'Pluralidades e diversidades identitárias na atualidade e as pautas dos povos indígenas no século XXI',a:1}
  ],
  'EF09HI24':[
    {s:'A história recente do Brasil: transformações políticas, econômicas, sociais e culturais de 1989 aos dias atuais',a:1}
  ],
  'EF09HI25':[
    {s:'Os protagonismos da sociedade civil e as alterações da sociedade brasileira',a:1}
  ],
  'EF09HI26':[
    {s:'A questão da violência contra populações marginalizadas',a:1}
  ],
  'EF09HI27':[
    {s:'O Brasil e suas relações internacionais na era da globalização',a:1}
  ],
  'EF09HI30':[
    {s:'Regimes ditatoriais latino-americanos: censura, opressão e reformas econômicas',a:1}
  ],
  'EF09HI33':[
    {s:'Tecnologias digitais e as transformações das relações políticas locais e globais',a:1}
  ],
  /* ===== HISTÓRIA — ENSINO MÉDIO =====
     Chaveado por DISCIPLINA|código: no EM os códigos são de área (EM13CHS…/GO-EMCHS…)
     e se repetem entre História, Sociologia, Filosofia e Geografia. */
  /* --- 1ª série --- */
  'História|GO-EMCHS103A':[
    {s:'O que é História: fontes, fatos e interpretações',a:1},
    {s:'Tempo histórico: periodização e a crítica ao eurocentrismo',a:1},
    {s:'Quem escreve a História? Vozes silenciadas e história vista de baixo',a:1},
    {s:'Patrimônio, memória e história oral (saberes indígenas e africanos)',a:1}
  ],
  'História|GO-EMCHS101A':[
    {s:'A humanidade nasce na África: hominização e migrações',a:1},
    {s:'Revolução Agrícola e as primeiras aldeias',a:1},
    {s:'Civilizações do Oriente e da África (Egito, Mesopotâmia, Núbia/Kush)',a:2},
    {s:'Povos originários da América antes de 1492',a:1}
  ],
  'História|GO-EMCHS501A':[
    {s:'Grécia: a pólis e a democracia ateniense (e quem ficava de fora)',a:1},
    {s:'Roma: república, império e o direito romano',a:1},
    {s:'Escravidão antiga e os limites da cidadania clássica',a:1},
    {s:'A crítica ao mito do "berço da civilização"',a:1}
  ],
  'História|EM13CHS104':[
    {s:'O que as fontes materiais revelam sobre as sociedades',a:1},
    {s:'Patrimônio material e imaterial: o que se preserva e o que se apaga',a:1},
    {s:'Identidade e diversidade cultural no tempo e no espaço',a:1}
  ],
  'História|EM13CHS402':[
    {s:'O feudalismo: terra, servidão e a Igreja',a:1},
    {s:'Suserania e vassalagem: as relações de poder',a:1},
    {s:'Trabalho e vida cotidiana no mundo feudal',a:1}
  ],
  /* --- 2ª série --- */
  'História|GO-EMCHS104D':[
    {s:'As Cruzadas: fé, comércio e o contato com o Oriente islâmico',a:1},
    {s:'Renascimento comercial e urbano: o ressurgir das cidades',a:1},
    {s:'Peste Negra e as revoltas camponesas',a:1},
    {s:'A crise do feudalismo e a transição para a Modernidade',a:1}
  ],
  'História|GO-EMCHS106B':[
    {s:'A formação dos Estados Modernos e o absolutismo',a:1},
    {s:'Mercantilismo: a lógica econômica da expansão',a:1},
    {s:'As Grandes Navegações e o protagonismo ibérico',a:1},
    {s:'O "encontro" como conquista: genocídio e escravização',a:2}
  ],
  'História|GO-EMCHS201D':[
    {s:'O Antigo Regime e a crise da monarquia francesa',a:1},
    {s:'1789: da Bastilha aos Direitos do Homem',a:1},
    {s:'A Revolução Haitiana e os limites da "liberdade"',a:1},
    {s:'Napoleão e os legados da Revolução',a:1}
  ],
  'História|GO-EMCHS201A':[
    {s:'Da manufatura à fábrica: máquinas, carvão e cidades',a:1},
    {s:'Questão social: infância operária e condições de trabalho',a:1},
    {s:'Resistências: ludismo, sindicatos e greves',a:1},
    {s:'A crítica socialista: Marx e a mais-valia',a:1},
    {s:'Capitalismo industrial e a crítica socialista',a:1}
  ],
  'História|EM13CHS601':[
    {s:'Indígenas e afrodescendentes como sujeitos da história do Brasil',a:1},
    {s:'Demandas e movimentos no Brasil contemporâneo',a:1},
    {s:'Cotas e políticas afirmativas: conquistas e limites',a:1},
    {s:'Inclusão precária e a luta por direitos',a:1}
  ],
  'História|GO-EMCHS601A':[
    {s:'A escravização e o tráfico atlântico',a:1},
    {s:'Políticas de assimilação e extermínio dos povos indígenas',a:1},
    {s:'As raízes coloniais da desigualdade étnico-racial',a:1}
  ],
  'História|GO-EMCHS601B':[
    {s:'Quilombos: Palmares e a liberdade construída',a:1},
    {s:'Revoltas e resistência cotidiana à escravidão',a:1},
    {s:'Contribuições culturais e religiosas de matriz africana e indígena',a:1}
  ],
  /* --- 3ª série --- */
  'História|GO-EMCHS603A':[
    {s:'Imperialismo: a corrida por mercados e colônias',a:1},
    {s:'Partilha da África e da Ásia (Conferência de Berlim)',a:1},
    {s:'Resistências africanas e asiáticas ao domínio europeu',a:1},
    {s:'A Primeira Guerra Mundial e as tropas coloniais',a:2}
  ],
  'História|GO-EMCHS603C':[
    {s:'A Rússia czarista: atraso e desigualdade',a:1},
    {s:'1917: as revoluções de fevereiro e outubro',a:1},
    {s:'Da URSS ao stalinismo',a:1}
  ],
  'História|GO-EMCHS604A':[
    {s:'Totalitarismos e a eclosão da Segunda Guerra',a:1},
    {s:'Holocausto e os crimes contra a humanidade',a:1},
    {s:'ONU, OTAN e o início da Guerra Fria',a:1},
    {s:'Descolonização da África e da Ásia no pós-guerra',a:1}
  ],
  'História|GO-EMCHS305A':[
    {s:'Os governos pós-Era Vargas e o desenvolvimentismo',a:1},
    {s:'Políticas ambientais e seus impactos',a:1},
    {s:'Instituições de fiscalização ambiental (IBAMA, ICMBio)',a:1}
  ],
  'História|GO-EMCHS605B':[
    {s:'A Declaração Universal dos Direitos Humanos',a:1},
    {s:'A Ditadura Militar (1964-1985): repressão e resistência',a:2},
    {s:'Consequências do regime e a luta por memória e justiça',a:1}
  ],
  /* ===== FILOSOFIA — ENSINO MÉDIO =====
     Primeiras entradas: 3º Bimestre, 1ª/2ª/3ª séries. */
  'Filosofia|GO-EMCHS502C':[
    {s:'Liberdade de expressão: filósofos e sofistas no período clássico',a:1},
    {s:'Liberdade pública e liberdade privada: a reflexão de Benjamin Constant',a:1}
  ],
  'Filosofia|GO-EMCHS205D':[
    {s:'A Escola de Frankfurt e a indústria cultural: Adorno e Horkheimer',a:1},
    {s:'Cultura de massa: alienação ou empoderamento juvenil?',a:1}
  ],
  'Filosofia|GO-EMCHS605A':[
    {s:'Direitos naturais: vida, liberdade e propriedade em Locke e Rousseau',a:1}
  ],
  'Filosofia|EM13CHS502':[
    {s:'Direitos Humanos e dignidade humana: da desigualdade à ação',a:1}
  ],
  'Filosofia|EM13CHS205':[
    {s:'Cultura e poder: entre a indústria cultural e as culturas populares',a:1}
  ],
  'Filosofia|EM13CHS605':[
    {s:'Princípios dos Direitos Humanos: justiça, igualdade e fraternidade',a:1}
  ],
  /* ===== SOCIOLOGIA — ENSINO MÉDIO =====
     Primeiras entradas: 1ª série, 3º Bimestre. */
  'Sociologia|GO-EMCHS402A':[
    {s:'O modo de produção capitalista: mercadoria, valor e mais-valia',a:1}
  ],
  'Sociologia|GO-EMCHS403A':[
    {s:'Uberização, plataformização e precarização: as novas formas de trabalho',a:1}
  ]
};

function catalogoSubtemas(it, disc){
  try{
    if(!it) return null;
    if(disc && SUBTEMAS[disc+'|'+it.c]) return SUBTEMAS[disc+'|'+it.c];
    return SUBTEMAS[it.c]||null;
  }catch(e){ return null; }
}
