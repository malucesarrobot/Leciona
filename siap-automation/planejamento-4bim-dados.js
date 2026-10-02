/* Plano de 6 semanas de conteúdo novo pro 4º bimestre, por série/disciplina,
   extraído do artefato "Planejamento 4º Bimestre" (Claude Docs, aprovado
   pela Malu). Cada turma-disciplina EFG tem 1 aula/semana = 6 aulas de
   conteúdo; depois dessas 6, o restante das aulas abertas no SIAP (até
   18/12) segue Correção de Prova -> Recomposição de Aprendizagens (repetida)
   -> Recuperação (sempre a última) — ainda não detalhado aqui, confirmar
   com a Malu antes de aplicar.

   codigosBNCC: lista de códigos EM13CHSxxx da habilidade (pra achar a opção
   certa no dropdown #ddlEixo do SIAP, que lista as habilidades do bimestre).
   tema: nome da aula/semana (pra achar o objeto de conhecimento equivalente
   no grid do SIAP, por fuzzy match).
   matrizGO: código GO-EMCHSxxx da matriz de Goiás (pra achar a "habilidade"
   específica dentro do grid, que aparece como "OBJETIVOS DE APRENDIZAGEM DO
   DC-GOEM - (GO-EMCHSxxx)" no SIAP). */

const PLANO_4BIM = {
  Historia: {
    '1': [ // 1A, 1B — Mundo medieval
      { tema: 'Formação do Feudalismo', bncc: ['EM13CHS101', 'EM13CHS104'], matrizGO: 'GO-EMCHS602C' },
      { tema: 'Sociedade Feudal', bncc: ['EM13CHS101', 'EM13CHS103'], matrizGO: 'GO-EMCHS602C' },
      { tema: 'Religiões e Culturas Medievais', bncc: ['EM13CHS102', 'EM13CHS104', 'EM13CHS106'], matrizGO: 'GO-EMCHS602C' },
      { tema: 'África Medieval e Mediterrâneo', bncc: ['EM13CHS102', 'EM13CHS104', 'EM13CHS106'], matrizGO: 'GO-EMCHS602C' },
      { tema: 'Transformações da Baixa Idade Média', bncc: ['EM13CHS101', 'EM13CHS103', 'EM13CHS106'], matrizGO: 'GO-EMCHS602C' },
      { tema: 'Crise do Século XIV (síntese)', bncc: ['EM13CHS101', 'EM13CHS103'], matrizGO: 'GO-EMCHS602C' },
    ],
    '2': [ // 2A, 2B — Da crise do Império à Era Vargas
      { tema: 'Crise do Império e Abolição', bncc: ['EM13CHS601', 'EM13CHS603'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Pós-Abolição e República', bncc: ['EM13CHS502', 'EM13CHS601', 'EM13CHS603'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Primeira República', bncc: ['EM13CHS602', 'EM13CHS603'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'A República Contestada', bncc: ['EM13CHS502', 'EM13CHS503', 'EM13CHS504', 'EM13CHS602'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Crise Oligárquica', bncc: ['EM13CHS602', 'EM13CHS603'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Era Vargas', bncc: ['EM13CHS602', 'EM13CHS603', 'EM13CHS401'], matrizGO: 'GO-EMCHS602B' },
    ],
    '3': [ // 3A, 3B, 3C — Redemocratização, cidadania e mundo contemporâneo
      { tema: 'Ditadura e Redemocratização', bncc: ['EM13CHS602', 'EM13CHS605'], matrizGO: 'GO-EMCHS605C' },
      { tema: 'Constituição de 1988', bncc: ['EM13CHS605', 'EM13CHS601'], matrizGO: 'GO-EMCH605D' },
      { tema: 'Nova República', bncc: ['EM13CHS602', 'EM13CHS606'], matrizGO: 'GO-EMCHS605C' },
      { tema: 'Movimentos Sociais e Cidadania', bncc: ['EM13CHS501', 'EM13CHS601', 'EM13CHS605'], matrizGO: 'GO-EMCHS605C' },
      { tema: 'Neoliberalismo e Globalização', bncc: ['EM13CHS201', 'EM13CHS401', 'EM13CHS402'], matrizGO: 'GO-EMCH605D' },
      { tema: 'Brasil, BRICS e Sul Global', bncc: ['EM13CHS201', 'EM13CHS204', 'EM13CHS604'], matrizGO: null },
    ],
  },
  Filosofia: {
    '1': [ // 1A, 1B — Lógica, argumentação e filosofias da vida
      { tema: 'Pensar e Argumentar', bncc: ['EM13CHS103'], matrizGO: 'GO-EMCHS606A' },
      { tema: 'Falácias e Persuasão', bncc: ['EM13CHS103'], matrizGO: 'GO-EMCHS606A' },
      { tema: 'Epicurismo', bncc: ['EM13CHS501'], matrizGO: 'GO-EMCHS606A' },
      { tema: 'Estoicismo e Ceticismo', bncc: ['EM13CHS501'], matrizGO: 'GO-EMCHS606A' },
      { tema: 'Dignidade e Reconhecimento', bncc: ['EM13CHS501', 'EM13CHS502', 'EM13CHS605'], matrizGO: 'GO-EMCHS606A' },
      { tema: 'Síntese', bncc: ['EM13CHS103', 'EM13CHS501'], matrizGO: 'GO-EMCHS606A' },
    ],
    '2': [ // 2A, 2B — Ética socioambiental e filosofias ameríndias
      { tema: 'Humanidade e Natureza', bncc: ['EM13CHS301', 'EM13CHS304', 'EM13CHS306'], matrizGO: 'GO-EMCHS301D' },
      { tema: 'Ética Socioambiental', bncc: ['EM13CHS301', 'EM13CHS304', 'EM13CHS306'], matrizGO: 'GO-EMCHS301D' },
      { tema: 'Filosofias Ameríndias', bncc: ['EM13CHS302', 'EM13CHS304', 'EM13CHS306'], matrizGO: 'GO-EMCHS301D' },
      { tema: 'Ailton Krenak', bncc: ['EM13CHS302', 'EM13CHS304', 'EM13CHS306'], matrizGO: 'GO-EMCHS301D' },
      { tema: 'Justiça Socioambiental', bncc: ['EM13CHS302', 'EM13CHS304', 'EM13CHS306'], matrizGO: 'GO-EMCHS301D' },
      { tema: 'Síntese', bncc: ['EM13CHS301', 'EM13CHS303', 'EM13CHS306'], matrizGO: 'GO-EMCHS301D' },
    ],
    '3': [ // 3A, 3B, 3C — Arte, técnica, responsabilidade e colonialidade
      { tema: 'Estética e Filosofia da Arte', bncc: ['EM13CHS101', 'EM13CHS502'], matrizGO: null },
      { tema: 'Arte e Sociedade', bncc: ['EM13CHS303', 'EM13CHS504'], matrizGO: null },
      { tema: 'Hans Jonas', bncc: ['EM13CHS306', 'EM13CHS304'], matrizGO: 'GO-EMCHS306A' },
      { tema: 'Colonialidade e Natureza', bncc: ['EM13CHS204', 'EM13CHS306'], matrizGO: 'GO-EMCHS306A' },
      { tema: 'Achille Mbembe', bncc: ['EM13CHS502', 'EM13CHS503', 'EM13CHS306'], matrizGO: 'GO-EMCHS306A' },
      { tema: 'Síntese', bncc: ['EM13CHS304', 'EM13CHS306'], matrizGO: 'GO-EMCHS306A' },
    ],
  },
  Sociologia: {
    '1': [ // 1A, 1B — Weber, poder, Estado e violência
      { tema: 'Max Weber e Ação Social', bncc: ['EM13CHS101'], matrizGO: 'GO-EMCHS503B' },
      { tema: 'Racionalização e Modernidade', bncc: ['EM13CHS603'], matrizGO: 'GO-EMCHS503B' },
      { tema: 'Poder e Dominação', bncc: ['EM13CHS603'], matrizGO: 'GO-EMCHS503B' },
      { tema: 'Estado Moderno', bncc: ['EM13CHS603', 'EM13CHS503'], matrizGO: 'GO-EMCHS503B' },
      { tema: 'Violências Contemporâneas', bncc: ['EM13CHS502', 'EM13CHS503'], matrizGO: 'GO-EMCHS503B' },
      { tema: 'Síntese', bncc: ['EM13CHS503', 'EM13CHS603'], matrizGO: 'GO-EMCHS503B' },
    ],
    '2': [ // 2A, 2B — Desigualdade, poder e controle social
      { tema: 'Ilha das Flores + Estratificação e Desigualdade', bncc: ['EM13CHS502', 'EM13CHS606'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Raça, Gênero e Classe', bncc: ['EM13CHS502', 'EM13CHS601'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Estigma, Preconceito e Discriminação', bncc: ['EM13CHS502', 'EM13CHS503'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Cidade Desigual', bncc: ['EM13CHS202', 'EM13CHS502'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Poder e Controle Social', bncc: ['EM13CHS502', 'EM13CHS503'], matrizGO: 'GO-EMCHS602A' },
      { tema: 'Síntese', bncc: ['EM13CHS502', 'EM13CHS606'], matrizGO: 'GO-EMCHS602A' },
    ],
    '3': [ // 3A, 3B, 3C — Direitos Humanos, identidades e movimentos sociais
      { tema: 'Cidadania e Direitos Humanos', bncc: ['EM13CHS605'], matrizGO: 'GO-EMCH605D' },
      { tema: 'Raça e Racismo', bncc: ['EM13CHS502', 'EM13CHS601', 'EM13CHS605'], matrizGO: 'GO-EMCH605D' },
      { tema: 'Gênero, Identidade e Reconhecimento', bncc: ['EM13CHS502', 'EM13CHS605', 'EM13CHS606'], matrizGO: 'GO-EMCH605D' },
      { tema: 'Povos Indígenas e Território', bncc: ['EM13CHS601', 'EM13CHS605'], matrizGO: 'GO-EMCH605D' },
      { tema: 'Movimentos Sociais Contemporâneos', bncc: ['EM13CHS501', 'EM13CHS601', 'EM13CHS605'], matrizGO: 'GO-EMCH605D' },
      { tema: 'Síntese', bncc: ['EM13CHS605', 'EM13CHS606'], matrizGO: 'GO-EMCHS605C' },
    ],
  },
};

// Turmas por série (letras) — EFG, composição 571
const TURMAS_POR_SERIE = {
  '1': ['A', 'B'],
  '2': ['A', 'B'],
  '3': ['A', 'B', 'C'],
};

module.exports = { PLANO_4BIM, TURMAS_POR_SERIE };
