#!/bin/bash

# Script para gerenciar emails autorizados para login com Google
# Uso: ./manage-admin-emails.sh add|list|remove [email]

API_URL="${API_URL:-http://localhost:3000}"
ADMIN_SECRET="${ADMIN_API_SECRET:-}"

if [ -z "$ADMIN_SECRET" ]; then
  echo "❌ Erro: ADMIN_API_SECRET não está definido"
  echo "Defina com: export ADMIN_API_SECRET=seu_token_aqui"
  exit 1
fi

case "$1" in
  add)
    if [ -z "$2" ]; then
      echo "❌ Erro: Email obrigatório"
      echo "Uso: $0 add email@example.com"
      exit 1
    fi
    echo "➕ Adicionando email: $2"
    curl -X POST "$API_URL/api/admin/emails" \
      -H "X-Admin-Secret: $ADMIN_SECRET" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$2\"}" \
      -s | jq .
    ;;
  
  list)
    echo "📋 Listando emails autorizados..."
    curl -X GET "$API_URL/api/admin/emails" \
      -H "X-Admin-Secret: $ADMIN_SECRET" \
      -s | jq .
    ;;
  
  remove)
    if [ -z "$2" ]; then
      echo "❌ Erro: Email obrigatório"
      echo "Uso: $0 remove email@example.com"
      exit 1
    fi
    echo "🗑️  Removendo email: $2"
    curl -X DELETE "$API_URL/api/admin/emails" \
      -H "X-Admin-Secret: $ADMIN_SECRET" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$2\"}" \
      -s | jq .
    ;;
  
  *)
    echo "Gerenciar emails autorizados para Google OAuth"
    echo ""
    echo "Uso: $0 [comando] [email]"
    echo ""
    echo "Comandos:"
    echo "  add [email]     Adicionar email autorizado"
    echo "  list            Listar emails autorizados"
    echo "  remove [email]  Remover email autorizado"
    echo ""
    echo "Exemplos:"
    echo "  export ADMIN_API_SECRET=seu_token_secreto"
    echo "  $0 add admin@example.com"
    echo "  $0 list"
    echo "  $0 remove admin@example.com"
    exit 1
    ;;
esac
