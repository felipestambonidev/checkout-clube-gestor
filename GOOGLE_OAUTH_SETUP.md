# Google OAuth Admin Login - Guia de Implementação

## ✅ O que foi implementado

Adicionei autenticação via Google OAuth no painel admin, mantendo também o login tradicional (usuário/senha). Todos os emails autorizados são armazenados no DynamoDB **criptografados com AES-256-GCM** para máxima segurança.

## 📋 Componentes criados

### 1. **lib/encryption.ts** - Utilitário de Criptografia
- Criptografa/descriptografa emails com AES-256-GCM
- Usa PBKDF2 para derivar a chave a partir da `ADMIN_EMAIL_ENCRYPTION_KEY`
- Adiciona IV aleatório a cada criptografia para máxima segurança

### 2. **lib/admin-emails.ts** - Gerenciamento de Emails Autorizados
- `isEmailAuthorized()` - Verifica se um email está autorizado
- `addAuthorizedEmail()` - Cadastra um novo email (criptografado)
- `removeAuthorizedEmail()` - Remove um email
- `listAuthorizedEmails()` - Lista emails (descriptografados apenas para leitura)

### 3. **lib/auth.ts** - Configuração do Auth.js v5
- Integra Google OAuth como provider
- Valida se o email do usuário está na lista de autorizados
- Redireciona para /admin após login bem-sucedido

### 4. **app/api/auth/[...nextauth]/route.ts** - Rota do NextAuth
- Handler padrão do Auth.js

### 5. **app/api/admin/emails/route.ts** - API Protegida para Gerenciar Emails
- Requer header `X-Admin-Secret` (seu `ADMIN_API_SECRET`)
- Suporta GET, POST e DELETE
- Retorna erros descritivos em JSON

### 6. **components/providers.tsx** - SessionProvider
- Wrapper necessário para o Auth.js funcionar no cliente

### 7. **app/admin/page.tsx** - Interface atualizada
- Botão "Entrar com Google" adicionado à tela de login
- Verificação de autenticação via sessão do Google
- Mantém compatibilidade com login tradicional

## 🔐 Variáveis de Ambiente Configuradas

```
AUTH_GOOGLE_ID              # ID do cliente OAuth do Google
AUTH_GOOGLE_SECRET          # Secret do cliente OAuth do Google
AUTH_SECRET                 # Chave secreta do Auth.js (JWT)
ADMIN_EMAIL_ENCRYPTION_KEY  # Chave para criptografar emails no DynamoDB
ADMIN_API_SECRET            # Token secreto da API de gerenciamento
```

## 📱 Como Usar - Fluxo de Login

1. **Usuário clica em "Entrar com Google"**
   - Redireciona para Google OAuth
   - Google retorna email do usuário

2. **Validação de Email**
   - Sistema verifica se o email está na lista autorizada (criptografada)
   - Se autorizado → login bem-sucedido → redireciona para /admin
   - Se não autorizado → exibe erro

3. **Sessão Criada**
   - Sessão segura criada via Auth.js
   - Persiste por navegador/dispositivo

## 🛠️ Como Gerenciar Emails via API

### Adicionar email autorizado
```bash
curl -X POST http://localhost:3000/api/admin/emails \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_secret_here" \
  -d '{"email": "usuario@example.com"}'
```

### Listar emails autorizados
```bash
curl -X GET http://localhost:3000/api/admin/emails \
  -H "X-Admin-Secret: your_admin_secret_here"
```

### Remover email
```bash
curl -X DELETE http://localhost:3000/api/admin/emails \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_secret_here" \
  -d '{"email": "usuario@example.com"}'
```

## 🔒 Segurança Implementada

### 1. Criptografia de Emails
- AES-256-GCM (padrão militar)
- IV aleatório a cada criptografia
- Chave derivada com PBKDF2 (100.000 iterações)
- Impossível ver emails em texto claro no banco

### 2. Proteção da API
- Requer `X-Admin-Secret` em cada request
- Sem token correto = erro 401
- Impede acesso não autorizado

### 3. OAuth Google
- Valida token ID do Google
- Impede spoofing de email
- Sessão segura com JWT

### 4. Validação
- Emails validados antes de autorizar login
- Consulta ao DynamoDB sempre que necessário
- Sem caching de lista de emails (sempre atualizado)

## 📊 Estrutura no DynamoDB

Tabela: `AdminAuthorizedEmails`
```
PK: email_hash (hash SHA-256 criptografado)
SK: timestamp
Atributos:
  - encryptedEmail: string (email criptografado)
  - addedAt: number (timestamp de quando foi adicionado)
```

## 🚀 Próximos Passos Recomendados

1. **Configurar Google OAuth**
   - Acesse Google Cloud Console
   - Crie credenciais OAuth 2.0
   - Adicione URLs autorizadas:
     - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
     - `https://seu-dominio.com/api/auth/callback/google` (produção)

2. **Testar Login**
   - Vá para `/admin`
   - Clique em "Entrar com Google"
   - Confirme que funciona

3. **Cadastrar Emails Autorizados**
   - Use a API para adicionar emails
   - Teste login com um email cadastrado

4. **Audit Log (Opcional)**
   - Considere adicionar registro de quem adicionou/removeu emails
   - Considere adicionar tentativas de login falhadas

## ⚠️ Observações Importantes

- Os emails no DynamoDB estão **criptografados**
- A chave de criptografia deve ser **mantida segura**
- O `ADMIN_API_SECRET` deve ser **único e forte**
- Use HTTPS em produção (obrigatório para OAuth)
- O Auth.js gerencia automaticamente refresh de tokens

## 🐛 Troubleshooting

**Login com Google não funciona:**
- Verifique `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`
- Confirme URLs autorizadas no Google Cloud Console
- Verifique se `AUTH_SECRET` está definido

**API retorna 401:**
- Confirme que `X-Admin-Secret` está correto
- Verifique header está sendo enviado

**Email não consegue logar:**
- Verifique se email foi cadastrado corretamente via API
- Confirme `ADMIN_EMAIL_ENCRYPTION_KEY` é a mesma em todas as requisições
- Verifique permissões do DynamoDB

---

**Implementado com sucesso!** Seu painel admin agora tem autenticação segura via Google com emails protegidos no banco.
