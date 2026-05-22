# 🚀 Quick Start - ASAAS Checkout

## 3 Passos para Começar

### 1️⃣ Configurar Variáveis de Ambiente (2 min)

No Vercel, adicione:

```
ASAAS_API_KEY=sua_chave_api_sandbox_aqui
ASAAS_WEBHOOK_TOKEN=gere_uma_uuid_aqui
N8N_WEBHOOK_URL=seu_webhook_n8n_aqui
```

**Onde obter?**
- ASAAS_API_KEY: https://sandbox.asaas.com → Configurações → Integrações → API
- ASAAS_WEBHOOK_TOKEN: Gere uma UUID em https://www.uuidgenerator.net/
- N8N_WEBHOOK_URL: Seu webhook do n8n que você já tem

### 2️⃣ Configurar Webhook ASAAS (3 min)

1. Acesse https://sandbox.asaas.com
2. Vá para **Configurações** > **Webhooks**
3. Clique em **Novo Webhook**
4. Configure:
   - **URL**: `https://seu-site.com/api/webhooks/asaas`
   - **Eventos**: Selecione `payment_received`, `payment_confirmed`, `payment_approved`
5. Salve

### 3️⃣ Testar Tudo (5 min)

```
1. Acesse https://seu-site.com/test-asaas
2. Clique em "Executar Testes"
3. Verifique se todos passaram ✓
```

## ✅ Você Está Pronto!

Agora você pode:
- Acessar `/` para ver o checkout integrado
- Testar com cartão `4111111111111111`
- Gerar PIX com QR Code
- Gerar boleto com código de barras

## 📚 Precisa de Mais?

- **Setup detalhado**: [ASAAS_SETUP.md](./ASAAS_SETUP.md)
- **Documentação técnica**: [README_ASAAS.md](./README_ASAAS.md)
- **Implementação completa**: [IMPLEMENTACAO_COMPLETA.md](./IMPLEMENTACAO_COMPLETA.md)

## 🐛 Algo não funcionou?

1. Verifique se variáveis estão configuradas: Vá para Vercel > Settings > Environment Variables
2. Teste em `/test-asaas` para diagnóstico automático
3. Verifique logs no Vercel: Deployments > Logs
4. Consulte [ASAAS_SETUP.md](./ASAAS_SETUP.md) na seção Troubleshooting

## 💡 Dicas

- Dados de cartão são processados com segurança (nunca armazenam no servidor)
- PIX usa polling automático a cada 3 segundos
- Cupom com desconto 100% pula o checkout ASAAS
- n8n recebe notificação de cada pagamento

---

**Pronto para produção?** Siga [ASAAS_SETUP.md](./ASAAS_SETUP.md) seção "Migração para Produção"
