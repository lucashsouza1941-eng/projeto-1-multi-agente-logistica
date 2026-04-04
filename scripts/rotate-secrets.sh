#!/usr/bin/env bash
set -euo pipefail

echo "Gerando novos segredos..."
NEW_JWT_SECRET="$(openssl rand -base64 48)"
NEW_REFRESH_TOKEN_SECRET="$(openssl rand -base64 48)"

echo
echo "NOVO JWT_SECRET:"
echo "${NEW_JWT_SECRET}"
echo
echo "NOVO REFRESH_TOKEN_SECRET:"
echo "${NEW_REFRESH_TOKEN_SECRET}"
echo
echo "Próximos passos para o operador:"
echo "1) Atualize JWT_SECRET e REFRESH_TOKEN_SECRET no ambiente de produção."
echo "2) Faça rolling restart da API (quando possível) para aplicar os novos segredos."
echo "3) Monitore /health e logs após o restart."
echo
echo "ATENÇÃO: todos os access/refresh tokens ativos serão invalidados."
