# Checkout Transparente ASAAS - Implementação Completa

## 📋 Visão Geral

Este projeto implementa um checkout transparente do ASAAS com suporte a:
- **Cartão de Crédito**: Processamento direto com ASAAS
- **PIX**: QR Code com polling automático
- **Boleto**: Geração com código de barras

## 🔒 Segurança & Conformidade

- **LGPD**: Dados pessoais protegidos e consentidos
- **PCI DSS**: Dados de cartão processados apenas server-side
- **HTTPS**: Comunicação criptografada
- **Token Validation**: Webhooks autenticados

## 📁 Estrutura de Arquivos

### APIs
```
app/api/
├── asaas/
│   ├── create-customer/route.ts    # Criar cliente no ASAAS
│   ├── charge-card/route.ts        # Processar pagamento com cartão
│   ├── charge-pix/route.ts         # Gerar PIX com QR Code
│   ├── charge-boleto/route.ts      # Gerar boleto
│   └── check-payment/route.ts      # Verificar status do pagamento
├── webhooks/
│   └── asaas/route.ts              # Webhook ASAAS para confirmar pagamentos
└── send-webhook/route.ts           # Enviar dados ao n8n
```

### Componentes
```
components/
└── payment/
    ├── AddressForm.tsx             # Formulário de endereço completo
    ├── CardPayment.tsx             # Pagamento com cartão
    ├── PixPayment.tsx              # Pagamento com PIX
    └── BoletoPayment.tsx           # Pagamento com boleto
└── AsaasCheckout.tsx               # Componente principal de checkout
```

### Páginas
```
app/
├── page.tsx                        # Página de checkout (integrada com ASAAS)
├── obrigado/page.tsx               # Página de confirmação
└── test-asaas/page.tsx             # Página de testes da integração
```

### Utilitários
```
lib/
├── viacep.ts                       # Integração ViaCEP para auto-preenchimento
└── types/asaas.ts                  # Tipos TypeScript
```

## 🚀 Como Começar

### 1. Configuração Inicial

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
```

### 2. Variáveis de Ambiente

Adicione no `.env.local` ou no Vercel:

```
ASAAS_API_KEY=sua_chave_api_sandbox
ASAAS_WEBHOOK_TOKEN=seu_token_secreto
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/endpoint
```

### 3. Configurar Webhook do ASAAS

1. Acesse https://sandbox.asaas.com
2. Vá para **Configurações** > **Webhooks**
3. Adicione URL: `https://seu-site.com/api/webhooks/asaas`
4. Selecione eventos de pagamento

Veja [ASAAS_SETUP.md](./ASAAS_SETUP.md) para instruções detalhadas.

## 💳 Fluxo de Pagamento

### Passo 1: Página de Checkout
```
Usuário preenche:
- Nome, email, telefone, empresa, CPF
- Aplica cupom (opcional)
```

### Passo 2: Endereço Completo
```
Se houver valor a pagar:
- Endereço completo com CEP
- Auto-preenchimento via ViaCEP
- Cria cliente no ASAAS
```

### Passo 3: Método de Pagamento
```
Escolhe entre:
- Cartão de Crédito
- PIX (com QR Code)
- Boleto
```

### Passo 4: Processamento
```
- API server-side processa o pagamento
- Dados de cartão nunca tocam o frontend
- Recebe paymentId e status
```

### Passo 5: Confirmação
```
- Redireciona para /obrigado
- Registra dados no DynamoDB
- Envia webhook ao n8n
```

## 🎯 Fluxo Especial: Cupom 100%

Quando o cupom zera o valor:

```
1. Pula formulário de endereço
2. Envia dados ao n8n imediatamente
3. Redireciona direto para /obrigado
```

## 🧪 Testando

### Página de Testes
Acesse `/test-asaas` para executar validações automáticas

### Cartões de Teste (Sandbox)
- **Visa**: `4111111111111111`
- **Mastercard**: `5555555555554444`
- Validade: Qualquer data futura
- CVV: `123`

### PIX e Boleto
- QR Code e código de barras são gerados automaticamente
- Simule pagamentos no dashboard do ASAAS

## 📊 Dados Enviados ao n8n

### Pagamento com Sucesso
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

### Webhook ASAAS
```json
{
  "source": "asaas_webhook",
  "paymentId": "pay_abc123",
  "customerId": "cus_abc123",
  "status": "RECEIVED",
  "value": 228.00,
  "billingType": "CREDIT_CARD",
  "timestamp": "2026-05-22T10:30:00Z"
}
```

## 🔍 Validações

### Formulário de Endereço
- ✓ Todos os campos obrigatórios
- ✓ Email válido
- ✓ CEP com auto-preenchimento
- ✓ Formatação automática

### Cartão de Crédito
- ✓ Nome do titular
- ✓ Número do cartão (13+ dígitos)
- ✓ Validade (MM/AA)
- ✓ CVV (3-4 dígitos)

### Dados Pessoais
- ✓ Sem caracteres especiais inválidos
- ✓ Formatação de telefone
- ✓ Validação de email

## 🐛 Troubleshooting

### "ASAAS_API_KEY não configurada"
- Verifique variáveis de ambiente
- Redeploy após adicionar variável

### "Token inválido" (Webhook)
- Confirme `ASAAS_WEBHOOK_TOKEN`
- Verifique URL no ASAAS

### PIX não confirma
- Verifique logs do webhook
- Confira se QR Code foi gerado
- Simule pagamento no dashboard ASAAS

### n8n não recebe dados
- Teste URL com curl/Postman
- Verifique logs do n8n
- Confirme `N8N_WEBHOOK_URL`

## 📚 Documentação

- [ASAAS_SETUP.md](./ASAAS_SETUP.md) - Guia de configuração completo
- [ASAAS Docs](https://docs.asaas.com) - Documentação oficial
- [n8n Docs](https://docs.n8n.io) - Documentação n8n

## ✨ Funcionalidades Implementadas

- ✅ Formulário de endereço com validação completa
- ✅ Auto-preenchimento de CEP (ViaCEP)
- ✅ Criação de cliente no ASAAS
- ✅ Pagamento com cartão de crédito
- ✅ PIX com QR Code e polling automático
- ✅ Boleto com código de barras
- ✅ Webhook ASAAS para confirmação
- ✅ Integração com n8n
- ✅ Página de confirmação
- ✅ Cupom com desconto 100%
- ✅ LGPD compliance
- ✅ Proteção contra CSRF
- ✅ Validação de token em webhooks

## 🔄 Próximos Passos

1. **Testes**: Valide tudo em sandbox (`/test-asaas`)
2. **Produção**: Migre chaves para produção do ASAAS
3. **Monitoramento**: Configure alertas para falhas
4. **Otimização**: Analise conversão e UX
5. **Suporte**: Prepare documentação para clientes

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte [ASAAS_SETUP.md](./ASAAS_SETUP.md)
2. Verifique logs no Vercel
3. Teste em `/test-asaas`
4. Entre em contato com ASAAS ou n8n
