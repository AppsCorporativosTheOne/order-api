#!/bin/sh
set -e
cd /app
if [ ! -x "node_modules/.bin/tsx" ]; then
  echo "[docker dev] Instalando dependencias (primeira subida ou volume vazio)..."
  npm ci
fi
exec "$@"
