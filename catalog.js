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
    {s:'Símbolos e mitos republicanos (positivismo, Tiradentes)',a:1}
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
    {s:'Quem mandava e quem era excluído da política',a:1}
  ],
  'GO-EF09HI03-C':[
    {s:'1888: abolição sem terra, trabalho ou reparação',a:1},
    {s:'Racismo de Estado: teorias raciais e branqueamento',a:1},
    {s:'Resistência negra: imprensa, clubes e matriz africana',a:1},
    {s:'Heranças da escravidão na desigualdade de hoje',a:1}
  ],
  'GO-EF09HI05-D':[
    {s:'Revolta da Vacina (1904): ciência e autoritarismo',a:1},
    {s:'Revolta da Chibata (1910): João Cândido e a Marinha negra',a:1},
    {s:'Canudos e Contestado: sertão, fé e a República contra os pobres',a:2},
    {s:'Cangaço como resistência social no Nordeste',a:1}
  ],
  /* ----- 9º · 2º BIMESTRE ----- */
  'GO-EF09HI06-A':[
    {s:'Revolução de 1930 e o fim da República Velha',a:1},
    {s:'Trabalhismo e CLT (1943): direitos e controle',a:1},
    {s:'Estado Novo (1937): ditadura, censura e culto a Vargas',a:1},
    {s:'O "pai dos pobres": propaganda x realidade',a:1}
  ],
  'GO-EF09HI06-B':[
    {s:'Marcha para o Oeste e a interiorização',a:1},
    {s:'Construção de Goiânia (1933): cidade planejada',a:1},
    {s:'Impactos sobre indígenas e camponeses do interior',a:1}
  ],
  'GO-EF09HI10-A':[
    {s:'O que é imperialismo: a corrida por colônias',a:1},
    {s:'Partilha da África (Conferência de Berlim, 1884-85)',a:1},
    {s:'Resistências africanas e asiáticas ao domínio europeu',a:1},
    {s:'Racismo científico como justificativa do imperialismo',a:1}
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
    {s:'Do sonho socialista ao stalinismo',a:1}
  ],
  'EF09HI12':[
    {s:'Os anos 1920 e a quebra da Bolsa de Nova York',a:1},
    {s:'Efeitos no mundo e no Brasil (a crise do café)',a:1},
    {s:'New Deal: o novo papel do Estado na economia',a:1}
  ],
  /* ----- 9º · 3º BIMESTRE ----- */
  'GO-EF09HI13-A':[
    {s:'Totalitarismo: nazismo, fascismo e as massas',a:1},
    {s:'Racismo de Estado e o Holocausto',a:1},
    {s:'A Segunda Guerra Mundial: frentes, viradas e fim',a:2},
    {s:'Tropas coloniais e a FEB: o esforço negro e latino na guerra',a:1},
    {s:'Bomba atômica e o novo medo do mundo',a:1}
  ],
  'GO-EF09HI17-A':[
    {s:'Redemocratização de 1945 e a Constituição de 1946',a:1},
    {s:'JK e os "50 anos em 5": a construção de Brasília',a:2},
    {s:'Jango e as Reformas de Base',a:1},
    {s:'Goiás e a marcha desenvolvimentista no Planalto Central',a:1}
  ],
  'GO-EF09HI19-A':[
    {s:'O golpe de 1964: atores e apoios civis-militares',a:1},
    {s:'Anos de chumbo: AI-5, censura, tortura e desaparecimentos',a:1},
    {s:'"Milagre econômico" x arrocho e concentração de renda',a:1},
    {s:'Resistências: estudantes, artistas, Igreja e mulheres',a:1},
    {s:'Anistia, Diretas Já e heranças no presente',a:1}
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
    {s:'A crítica socialista: Marx e a mais-valia',a:1}
  ],
  'História|EM13CHS601':[
    {s:'Indígenas e afrodescendentes como sujeitos da história do Brasil',a:1},
    {s:'Demandas e movimentos no Brasil contemporâneo',a:1},
    {s:'Cotas e políticas afirmativas: conquistas e limites',a:1}
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
  ]
};

function catalogoSubtemas(it, disc){
  try{
    if(!it) return null;
    if(disc && SUBTEMAS[disc+'|'+it.c]) return SUBTEMAS[disc+'|'+it.c];
    return SUBTEMAS[it.c]||null;
  }catch(e){ return null; }
}
