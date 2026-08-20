#!/usr/bin/env bash
# deploy.sh — valida sintaxe e publica o Leciona no GitHub Pages.
# Uso: ./deploy.sh "descrição da mudança"
set -euo pipefail
cd "$(dirname "$0")"

msg="${1:-}"
if [ -z "$msg" ]; then
  echo "Uso: ./deploy.sh \"descrição da mudança\"" >&2
  exit 1
fi

echo "→ Validando sintaxe dos arquivos JS…"

check_js() {
  node --check "$1"
}

for f in catalog.js prebuilt.js; do
  if [ -f "$f" ]; then
    check_js "$f" || { echo "✗ Erro de sintaxe em $f — deploy abortado." >&2; exit 1; }
    echo "  ✓ $f"
  fi
done

if [ -f index.html ]; then
  tmp_js="$(mktemp -t leciona_inline).js"
  awk '/<script>/{f=1; next} /<\/script>/{f=0} f' index.html > "$tmp_js"
  check_js "$tmp_js" || { echo "✗ Erro de sintaxe no <script> do index.html — deploy abortado." >&2; rm -f "$tmp_js"; exit 1; }
  rm -f "$tmp_js"
  echo "  ✓ index.html (script inline)"
fi

echo "→ Sintaxe OK."

if [ -f functions/index.js ]; then
  echo "→ Conferindo se SCHEDULE de index.html e functions/index.js estão em sync…"
  node -e "
    const fs=require('fs');
    function extractSchedule(file){
      const src=fs.readFileSync(file,'utf8');
      const m=src.match(/const SCHEDULE\s*=\s*(\[[\s\S]*?\n\]);/);
      if(!m) throw new Error('SCHEDULE não encontrado em '+file);
      return eval(m[1]);
    }
    const a=extractSchedule('index.html');
    const b=extractSchedule('functions/index.js');
    if(JSON.stringify(a)!==JSON.stringify(b)){
      console.error('✗ SCHEDULE diverge entre index.html e functions/index.js — atualize os dois (importarPlanilhaAgora/Agendado usa a cópia de functions/index.js pra saber os dias de aula) antes de publicar.');
      process.exit(1);
    }
  " || { echo "  (deploy abortado — SCHEDULE fora de sync)" >&2; exit 1; }
  echo "  ✓ SCHEDULE em sync"
fi

if [ -f sw.js ]; then
  novo_cache="leciona-$(date +%Y%m%d%H%M%S)"
  sed -i '' "s/const CACHE = '[^']*'/const CACHE = '$novo_cache'/" sw.js
  echo "  ✓ sw.js — cache renomeado pra $novo_cache (força os navegadores a buscar a versão nova em vez de servir a antiga)"
fi

echo "→ Commitando…"
git add -A
git commit -m "$msg"

echo "→ Enviando para o GitHub (origin/main)…"
git push origin main

echo "✓ Deploy concluído. O GitHub Pages deve atualizar em 1–2 minutos:"
echo "  https://malucesarrobot.github.io/Leciona/"
