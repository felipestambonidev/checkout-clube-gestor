import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL;
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

  // Detectar ambiente baseado na URL
  let environment = 'not_configured';
  let urlValid = false;
  
  if (apiUrl) {
    if (apiUrl.includes('sandbox.asaas.com')) {
      environment = 'sandbox';
      urlValid = true;
    } else if (apiUrl.includes('api.asaas.com') && !apiUrl.includes('sandbox')) {
      environment = 'production';
      urlValid = true;
    } else {
      environment = 'unknown';
    }
  }

  // Verificar formato da API key
  let keyValid = false;
  let keyFormat = 'not_configured';
  if (apiKey) {
    if (apiKey.startsWith('$aact_')) {
      keyFormat = 'production_key';
      keyValid = true;
    } else if (apiKey.startsWith('$aact_') === false && apiKey.length > 10) {
      keyFormat = 'possibly_sandbox_or_invalid';
      keyValid = true;
    }
  }

  // Testar conexao com a API do ASAAS
  let connectionTest = {
    success: false,
    message: '',
    status: 0,
  };

  if (apiUrl && apiKey) {
    try {
      const testResponse = await fetch(`${apiUrl}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
        },
      });

      connectionTest.status = testResponse.status;
      
      if (testResponse.ok) {
        connectionTest.success = true;
        connectionTest.message = 'Conexao com ASAAS OK';
      } else {
        const errorData = await testResponse.json();
        connectionTest.message = errorData.errors?.[0]?.description || 
                                  errorData.message || 
                                  `Erro HTTP ${testResponse.status}`;
      }
    } catch (error) {
      connectionTest.message = error instanceof Error ? error.message : 'Erro de conexao';
    }
  } else {
    connectionTest.message = 'API URL ou API Key nao configuradas';
  }

  // Retornar diagnostico (sem expor valores sensíveis)
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    configuration: {
      ASAAS_API_URL: apiUrl ? {
        configured: true,
        value: apiUrl,
        environment,
        valid: urlValid,
      } : {
        configured: false,
        message: 'ASAAS_API_URL nao configurada. Defina como https://sandbox.asaas.com/api/v3 (sandbox) ou https://api.asaas.com/api/v3 (producao)',
      },
      ASAAS_API_KEY: {
        configured: !!apiKey,
        format: keyFormat,
        preview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : null,
      },
      ASAAS_WEBHOOK_TOKEN: {
        configured: !!webhookToken,
      },
    },
    connectionTest,
    recommendations: [
      !apiUrl && 'Configure ASAAS_API_URL com a URL correta para o ambiente desejado',
      !apiKey && 'Configure ASAAS_API_KEY com sua chave de API do ASAAS',
      environment === 'sandbox' && 'Ambiente sandbox detectado - lembre de mudar para producao quando estiver pronto',
      !connectionTest.success && connectionTest.message,
    ].filter(Boolean),
  });
}
