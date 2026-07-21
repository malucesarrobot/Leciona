#!/usr/bin/env python3
"""converter.py — importa aulas de um .docx para o prebuilt.js do Leciona.

Uso:
    pandoc -t markdown arquivo.docx | python3 converter.py            # dry-run: só mostra o que seria importado
    pandoc -t markdown arquivo.docx | python3 converter.py --write    # grava em prebuilt.js

Opções:
    --write              grava no prebuilt.js (por padrão só mostra prévia + relatório)
    --prebuilt CAMINHO    caminho do prebuilt.js (padrão: ./prebuilt.js, ao lado deste script)
    --force               sobrescreve temas que já existem no prebuilt.js (padrão: pula e avisa)

FORMATO ESPERADO NO .DOCX (use os estilos de título do Word — Título 1/2/3 —
que o pandoc converte em #, ##, ###):

    # Nome exato do tema
    (o nome deve bater com o nome do tema já cadastrado no Leciona — é a
    chave de busca em getPrebuilt())

    Código: GO-EF09HI13-A          <- opcional, só se você tiver certeza do
                                       código DC-GO/BNCC. NUNCA é inventado
                                       por este script — se a linha não
                                       existir, o campo "bncc" é omitido.

    ## Quadro
    texto corrido do quadro (o que vai pra lousa)

    ## Estudo
    texto corrido do estudo (prosa pro aluno ler)

    ## Slides
    ### Título do slide 1
    - tópico
    - tópico
    ### Título do slide 2
    - tópico

    ## Mapa mental
    # Tema central
    ## Ramo
    - subitem
    (fica em markdown puro, é assim que o app já guarda o mapa mental)

    ## Avaliação
    ### Questões
    1. Enunciado da questão
       a) alternativa 1
       b) alternativa 2
       c) alternativa 3
       d) alternativa 4
       e) alternativa 5
       Correta: c
       Comentário: por que é essa e por que as outras estão erradas

    ### Flashcards
    - Frente: pergunta | Verso: resposta

    ### Atividade
    1. Enunciado (sem gabarito embutido)

    ### Gabarito
    1. Resposta — comentário

Um mesmo arquivo pode ter VÁRIOS temas: basta repetir o "# Nome do tema"
quantas vezes precisar (útil pra importar um lote de subtemas de uma vez).

Qualquer seção que não seja encontrada é OMITIDA do resultado (nunca
preenchida com texto inventado) — o relatório impresso no fim avisa o que
faltou, pra você decidir se quer completar manualmente depois.

IMPORTANTE sobre o Mapa mental: o texto dessa seção já é markdown com #/##/-
(é assim que o app guarda internamente). Para o pandoc NÃO confundir esses
"#" internos com um novo título de tema, digite o conteúdo do Mapa mental
como TEXTO COMUM no Word (sem aplicar estilo "Título 1/2/3") — só os títulos
de seção (Quadro, Estudo, Slides, Mapa mental, Avaliação, e os subtítulos de
slide/avaliação) devem usar estilo de Título. Evite também nomear um ramo do
mapa exatamente "Quadro"/"Estudo"/"Avaliação" etc. com estilo de Título, para
não ser confundido com uma seção de verdade.
"""
import sys
import re
import json
import argparse
import shutil
import subprocess
import unicodedata
from pathlib import Path


# ---------- normalização de headings (ignora acento/caixa) ----------
def _norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    return s.strip().lower()


SECOES_NIVEL2 = {
    'quadro': 'quadro',
    'estudo': 'estudo',
    'slides': 'slides',
    'mapa mental': 'mapaMental',
    'mapa': 'mapaMental',
    'avaliacao': 'avaliacao',
}
SUBSECOES_AVALIACAO = {
    'questoes': 'questoes',
    'flashcards': 'flashcards',
    'atividade': 'atividade',
    'gabarito': 'gabarito',
}


def split_by_heading(md, level):
    """Divide o texto em blocos por heading de um nível (#, ## ou ###),
    sem checar vocabulário — usado só DENTRO de um corpo já delimitado com
    segurança (slides, subseções de avaliação), onde não há o risco descrito
    abaixo. Retorna lista de (titulo, corpo)."""
    marker = '#' * level + ' '
    pattern = re.compile(r'^' + re.escape(marker) + r'(.+)$', re.MULTILINE)
    matches = list(pattern.finditer(md))
    out = []
    for i, m in enumerate(matches):
        titulo = m.group(1).strip()
        ini = m.end()
        fim = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        corpo = md[ini:fim].strip('\n')
        out.append((titulo, corpo))
    return out


ANCHOR_RE = re.compile(r'^##\s+(.+?)\s*$', re.MULTILINE)
TEMA_RE = re.compile(r'^#\s+(.+?)\s*$', re.MULTILINE)


def find_section_anchors(md):
    """Acha as seções conhecidas (## Quadro/Estudo/Slides/Mapa mental/
    Avaliação) em TODO o documento, pelo vocabulário fixo — não pela posição
    dentro de um tema. Isso é o que permite delimitar corretamente o corpo
    do Mapa mental mesmo que ele contenha, no meio do texto, uma linha "# ..."
    (o próprio mapa é markdown com #/##/-): como esse "#" não é uma seção
    conhecida de nível 2, ele nunca vira âncora, então o conteúdo do Mapa
    mental só termina na PRÓXIMA seção conhecida de verdade (ou fim do doc)."""
    anchors = []
    for m in ANCHOR_RE.finditer(md):
        key = SECOES_NIVEL2.get(_norm(m.group(1)))
        if not key:
            continue
        anchors.append({'key': key, 'line_start': m.start(), 'content_start': m.end()})
    for i, a in enumerate(anchors):
        a['content_end'] = anchors[i + 1]['line_start'] if i + 1 < len(anchors) else len(md)
    return anchors


def find_temas(md, anchors):
    """Acha os blocos de tema (# Nome do tema), ignorando qualquer "# " que
    caia DENTRO do corpo de uma seção conhecida (caso clássico: o heading
    interno de nível 1 que o Word criou para o "nó central" do Mapa mental)."""
    candidatos = []
    for m in TEMA_RE.finditer(md):
        pos = m.start()
        dentro_de_secao = any(a['content_start'] <= pos < a['content_end'] for a in anchors)
        if dentro_de_secao:
            continue
        candidatos.append({'nome': m.group(1).strip(), 'content_start': m.end(), 'line_start': pos})
    temas = []
    for i, c in enumerate(candidatos):
        content_end = candidatos[i + 1]['line_start'] if i + 1 < len(candidatos) else len(md)
        temas.append({'nome': c['nome'], 'content_start': c['content_start'], 'content_end': content_end})
    return temas


def parse_slides(corpo):
    """### Título do slide -> {titulo, topicos:[...]}"""
    slides = []
    for titulo, sub in split_by_heading(corpo, 3):
        topicos = [l.strip('-* ').strip() for l in sub.splitlines()
                   if l.strip().startswith(('-', '*'))]
        if not topicos:
            # aceita também linhas soltas sem marcador de lista
            topicos = [l.strip() for l in sub.splitlines() if l.strip()]
        slides.append({'titulo': titulo, 'topicos': topicos})
    return slides


QUESTAO_RE = re.compile(
    r'''^\s*\d+[.)]\s*(?P<enun>.+?)\n
        (?P<alts>(?:\s*[a-eA-E][.)]\s*.+\n?)+)
        \s*Correta\s*:\s*(?P<correta>[a-eA-E])\s*\n?
        (?:\s*Coment[aá]rio\s*:\s*(?P<coment>.*))?
    ''', re.VERBOSE | re.MULTILINE)


def parse_questoes(corpo):
    out = []
    corpo_norm = corpo + '\n'
    for m in QUESTAO_RE.finditer(corpo_norm):
        alt_lines = [l.strip() for l in m.group('alts').strip().splitlines() if l.strip()]
        alternativas = [re.sub(r'^[a-eA-E][.)]\s*', '', l) for l in alt_lines]
        letra = m.group('correta').lower()
        idx = ord(letra) - ord('a')
        out.append({
            'enunciado': m.group('enun').strip(),
            'alternativas': alternativas,
            'correta': idx,
            'comentario': (m.group('coment') or '').strip(),
        })
    return out


def parse_flashcards(corpo):
    out = []
    for linha in corpo.splitlines():
        linha = linha.strip('-* ').strip()
        if not linha:
            continue
        m = re.match(r'Frente\s*:\s*(.+?)\s*\|\s*Verso\s*:\s*(.+)$', linha, re.IGNORECASE)
        if m:
            out.append({'frente': m.group(1).strip(), 'verso': m.group(2).strip()})
    return out


def parse_itens_numerados(corpo, campo):
    """Usado por Atividade ({enunciado}) — cada linha numerada vira um item."""
    out = []
    for linha in corpo.splitlines():
        m = re.match(r'\s*\d+[.)]\s*(.+)$', linha)
        if m:
            out.append({campo: m.group(1).strip()})
    return out


def parse_gabarito(corpo):
    out = []
    for linha in corpo.splitlines():
        m = re.match(r'\s*\d+[.)]\s*(.+?)(?:\s*[—\-]\s*(.+))?$', linha)
        if m:
            out.append({'resposta': m.group(1).strip(), 'comentario': (m.group(2) or '').strip()})
    return out


def parse_avaliacao(corpo):
    av = {'questoes': [], 'flashcards': [], 'atividade': [], 'gabarito': []}
    encontrado = set()
    for titulo, sub in split_by_heading(corpo, 3):
        key = SUBSECOES_AVALIACAO.get(_norm(titulo))
        if not key:
            continue
        encontrado.add(key)
        if key == 'questoes':
            av['questoes'] = parse_questoes(sub)
        elif key == 'flashcards':
            av['flashcards'] = parse_flashcards(sub)
        elif key == 'atividade':
            av['atividade'] = parse_itens_numerados(sub, 'enunciado')
        elif key == 'gabarito':
            av['gabarito'] = parse_gabarito(sub)
    return av, encontrado


CODIGO_RE = re.compile(r'^\s*C[oó]digo\s*:\s*(.+)$', re.IGNORECASE | re.MULTILINE)


def parse_tema(md, nome, content_start, content_end, anchors):
    """Um tema (delimitado por find_temas) -> (nome, objeto, relatorio)."""
    obj = {}
    relatorio = {'encontrado': [], 'faltando': []}

    corpo_tema = md[content_start:content_end]
    m = CODIGO_RE.search(corpo_tema)
    if m:
        obj['bncc'] = [c.strip() for c in re.split(r'[,;]', m.group(1)) if c.strip()]

    secoes = {}
    for a in anchors:
        if content_start <= a['line_start'] < content_end:
            fim = min(a['content_end'], content_end)
            secoes[a['key']] = md[a['content_start']:fim].strip('\n')

    for chave_esperada in ['quadro', 'estudo', 'slides', 'mapaMental', 'avaliacao']:
        if chave_esperada not in secoes:
            relatorio['faltando'].append(chave_esperada)
            continue
        corpo_secao = secoes[chave_esperada]
        if chave_esperada == 'slides':
            obj['slides'] = parse_slides(corpo_secao)
        elif chave_esperada == 'mapaMental':
            obj['mapaMental'] = corpo_secao.strip()
        elif chave_esperada == 'avaliacao':
            av, encontrado_av = parse_avaliacao(corpo_secao)
            obj['avaliacao'] = av
            for k in ['questoes', 'flashcards', 'atividade', 'gabarito']:
                (relatorio['encontrado'] if k in encontrado_av else relatorio['faltando']).append('avaliacao.' + k)
        else:
            obj[chave_esperada] = corpo_secao.strip()
        relatorio['encontrado'].append(chave_esperada)

    return nome, obj, relatorio


def parse_markdown(md):
    """Markdown completo -> {nome_tema: objeto} + relatórios por tema."""
    anchors = find_section_anchors(md)
    temas_encontrados = find_temas(md, anchors)
    temas = {}
    relatorios = {}
    for t in temas_encontrados:
        nome, obj, rel = parse_tema(md, t['nome'], t['content_start'], t['content_end'], anchors)
        if not nome:
            continue
        temas[nome] = obj
        relatorios[nome] = rel
    return temas, relatorios


# ---------- leitura/escrita do prebuilt.js ----------
def load_prebuilt(path):
    texto = path.read_text(encoding='utf-8')
    ini = texto.index('{')
    fim = texto.index('};\n', ini) + 1
    literal = texto[ini:fim]
    obj = json.loads(literal)
    prefixo = texto[:ini]
    sufixo = texto[fim:]
    return obj, prefixo, sufixo


def dump_prebuilt(path, prefixo, obj, sufixo):
    linhas = [prefixo]
    for nome, dado in obj.items():
        linhas.append(json.dumps(nome, ensure_ascii=False) + ':' +
                       json.dumps(dado, ensure_ascii=False, separators=(',', ':')) + ',\n')
    linhas.append(sufixo)
    path.write_text(''.join(linhas), encoding='utf-8')


def node_check(path):
    try:
        r = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
        return r.returncode == 0, r.stderr
    except FileNotFoundError:
        return None, 'node não encontrado no PATH — não foi possível validar sintaxe automaticamente.'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--write', action='store_true', help='grava no prebuilt.js (padrão: só prévia)')
    ap.add_argument('--prebuilt', default=str(Path(__file__).parent / 'prebuilt.js'))
    ap.add_argument('--force', action='store_true', help='sobrescreve temas já existentes')
    args = ap.parse_args()

    md = sys.stdin.read()
    if not md.strip():
        print('Nada recebido no stdin. Use: pandoc -t markdown arquivo.docx | python3 converter.py', file=sys.stderr)
        sys.exit(1)

    temas, relatorios = parse_markdown(md)
    if not temas:
        print('Nenhum "# Nome do tema" encontrado no markdown. Confira o formato esperado (--help).', file=sys.stderr)
        sys.exit(1)

    print(f'{len(temas)} tema(s) reconhecido(s):\n')
    for nome, rel in relatorios.items():
        print(f'  • {nome}')
        if rel['encontrado']:
            print('      OK: ' + ', '.join(rel['encontrado']))
        if rel['faltando']:
            print('      faltando (NÃO inventado, ficou de fora): ' + ', '.join(rel['faltando']))
    print()

    if not args.write:
        print(json.dumps(temas, ensure_ascii=False, indent=2))
        print('\n(dry-run — nada foi gravado. Rode de novo com --write para inserir no prebuilt.js)')
        return

    prebuilt_path = Path(args.prebuilt)
    if not prebuilt_path.exists():
        print(f'Não encontrei {prebuilt_path}.', file=sys.stderr)
        sys.exit(1)

    obj, prefixo, sufixo = load_prebuilt(prebuilt_path)

    pulados = []
    for nome, dado in temas.items():
        if nome in obj and not args.force:
            pulados.append(nome)
            continue
        obj[nome] = dado

    backup_path = prebuilt_path.with_suffix('.js.bak')
    shutil.copy2(prebuilt_path, backup_path)
    dump_prebuilt(prebuilt_path, prefixo, obj, sufixo)

    ok, err = node_check(prebuilt_path)
    if ok is False:
        shutil.copy2(backup_path, prebuilt_path)
        print('✗ prebuilt.js gerado tem erro de sintaxe — revertido pro backup automaticamente.', file=sys.stderr)
        print(err, file=sys.stderr)
        sys.exit(1)
    elif ok is None:
        print('⚠ ' + err, file=sys.stderr)

    print(f'✓ Gravado em {prebuilt_path} (backup em {backup_path}).')
    if pulados:
        print('⚠ Pulados (já existiam, use --force para sobrescrever): ' + ', '.join(pulados))


if __name__ == '__main__':
    main()
