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

echo "→ Sintaxe OK. Commitando…"
git add -A
git commit -m "$msg"

echo "→ Enviando para o GitHub (origin/main)…"
git push origin main

echo "✓ Deploy concluído. O GitHub Pages deve atualizar em 1–2 minutos:"
echo "  https://malucesarrobot.github.io/Leciona/"
