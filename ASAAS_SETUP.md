# Guia de Integração ASAAS Checkout Transparente

## Configuração Inicial

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no seu projeto Vercel:

```
ASAAS_API_KEY=sua_chave_api_sandbox_aqui
ASAAS_WEBHOOK_TOKEN=seu_token_secreto_aqui
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/seu-endpoint
```

### 2. Obter Chave de API do ASAAS

1. Acesse https://sandbox.asaas.com (para testes)
2. Faça login com suas credenciais
3. Vá para **Configurações** > **Integrações** > **API**
4. Copie a **Chave de Acesso** e configure como `ASAAS_API_KEY`

### 3. Token Webhook

Gere um token seguro (pode ser uma UUID) para validar os webhooks do ASAAS:

```bash
# Linux/Mac
uuidgen

# Ou use um gerador online: https://www.uuidgenerator.net/
```

Configure este token como `ASAAS_WEBHOOK_TOKEN`.

### 4. Configurar Webhook do ASAAS

1. Acesse https://sandbox.asaas.com
2. Vá para **Configurações** > **Webhooks**
3. Clique em **Novo Webhook**
4. Configure:
   - **URL**: `https://seu-site.com/api/webhooks/asaas` (substitua pelo seu domínio)
   - **Eventos**: Selecione:
     - `payment_received` (Pagamento recebido)
     - `payment_confirmed` (Pagamento confirmado)
     - `payment_approved` (Pagamento aprovado)
     - `payment_overdue` (Pagamento vencido)
     - `payment_deleted` (Pagamento deletado)
5. Clique em **Salvar**

## Fluxo de Pagamento

### Checkout Transparente - Passo a Passo

1. **Coleta de Dados de Endereço**
   - Formulário completo com validação
   - Auto-preenchimento de CEP via ViaCEP
   - Dados protegidos em conformidade com LGPD

2. **Criação de Cliente**
   - API POST `/api/asaas/create-customer`
   - Dados de endereço completo enviados
   - Retorna `customerId` para usar nos pagamentos

3. **Processamento de Pagamento**
   - **Cartão**: POST `/api/asaas/charge-card`
   - **PIX**: POST `/api/asaas/charge-pix`
   - **Boleto**: POST `/api/asaas/charge-boleto`
   - Retorna `paymentId` e dados específicos

4. **Polling de Status (PIX)**
   - Frontend faz polling a cada 3 segundos
   - Monitora status: `RECEIVED`, `CONFIRMED`
   - Redireciona para `/obrigado` quando confirmado

5. **Webhook ASAAS**
   - ASAAS notifica `/api/webhooks/asaas`
   - Sistema valida token de segurança
   - Notifica n8n via `N8N_WEBHOOK_URL`

6. **Página de Obrigado**
   - Recebe `paymentId` como parâmetro
   - Registra dados no DynamoDB
   - Envia confirmação final ao n8n

## Segurança e LGPD

### Proteção de Dados

✓ **Dados de Cartão**: Nunca armazenados localmente
- Processados diretamente via API ASAAS (server-side only)
- Conformidade PCI DSS

✓ **Dados Pessoais**: Protegidos conforme LGPD
- Criptografia SSL/TLS em trânsito
- Armazenamento seguro no DynamoDB
- Consentimento explícito do usuário

✓ **Webhook Token**: Validação de origem
- Token secreto em cada requisição
- Previne processamento de webhooks não autorizados

### Conformidade

- **PCI DSS**: Pagamentos com cartão processados via ASAAS
- **LGPD**: Dados pessoais protegidos e consentidos
- **HTTPS**: Todas as comunicações criptografadas
- **Auditoria**: Logs de todas as transações

## Fluxo de Cupom 100%

Quando o cupom zera o valor (desconto de 100%):

1. Formulário de endereço é **pulado**
2. Dados da página anterior são salvos em `sessionStorage`
3. Webhook é enviado ao n8n imediatamente
4. Redirecionamento direto para `/obrigado`
5. Usuário **não entra no fluxo ASAAS**

## Integração com n8n

### Webhook URL

Configure a URL do webhook do n8n na variável `N8N_WEBHOOK_URL`.

### Dados Enviados

#### Pagamento com Sucesso
```json
{
  "source": "asaas_payment_success",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 99999-9999",
  "cpfCnpj": "123.456.789-00",
  "company": "Minha Empresa",
  "couponCode": "DESCONTO50",
  "finalPrice": 114.00,
  "paymentId": "pay_abc123",
  "timestamp": "2026-05-22T10:30:00Z"
}
```

#### Webhook ASAAS
```json
{
  "source": "asaas_webhook",
  "paymentId": "pay_abc123",
  "customerId": "cus_abc123",
  "status": "RECEIVED",
  "value": 228.00,
  "billingType": "CREDIT_CARD",
  "description": "Checkout Clube Gestor",
  "paymentDate": "2026-05-22",
  "externalReference": "123456",
  "timestamp": "2026-05-22T10:30:00Z"
}
```

## Testes

### Cartão de Teste
- Número: `4111111111111111`
- Validade: Qualquer data futura (ex: 12/25)
- CVV: `123`

### PIX de Teste
- QR Code será gerado automaticamente
- Escaneie com o app do seu banco de testes

### Boleto de Teste
- Código de barras será gerado
- Você pode simular o pagamento no admin do ASAAS

## Troubleshooting

### Erro: "ASAAS_API_KEY não configurada"
- Verifique se a variável está configurada no Vercel
- Redeploy o projeto após adicionar a variável

### Erro: "Token inválido" no webhook
- Confirme que `ASAAS_WEBHOOK_TOKEN` está correto
- Verifique se a URL do webhook está correta no ASAAS

### PIX não confirma pagamento
- Certifique-se de que o QR Code foi gerado
- Verifique os logs do webhook ASAAS
- Confirme que o polling está em execução no frontend

### n8n não recebe dados
- Verifique se `N8N_WEBHOOK_URL` está configurada
- Teste a URL manualmente com curl/Postman
- Confira os logs do n8n para erros

## Migração para Produção

Quando tudo estiver testado e funcionando no sandbox:

1. **Obtenha chaves de produção**
   - Acesse https://app.asaas.com (produção)
   - Siga os mesmos passos de configuração

2. **Atualize variáveis**
   - `ASAAS_API_KEY`: Chave de produção
   - `ASAAS_WEBHOOK_URL`: URL da produção

3. **Teste integração completa**
   - Realize testes com valores pequenos
   - Valide fluxo de webhook
   - Confirme integração com n8n

4. **Deploy**
   - Merge para main
   - Deploy em produção no Vercel

## Suporte

Para dúvidas sobre ASAAS: https://docs.asaas.com
Para dúvidas sobre n8n: https://docs.n8n.io
