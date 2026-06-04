import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL;
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

  // Detectar ambiente baseado na URL
  let environment = 'not_configured';
  let urlValid = false;
  let urlIssue = '';
  
  if (apiUrl) {
    if (apiUrl.includes('sandbox.asaas.com')) {
      environment = 'sandbox';
      // URL do sandbox e https://sandbox.asaas.com/api/v3
      urlValid = apiUrl === 'https://sandbox.asaas.com/api/v3';
      if (!urlValid) {
        urlIssue = `URL de sandbox incorreta. Use: https://sandbox.asaas.com/api/v3`;
      }
    } else if (apiUrl.includes('api.asaas.com') && !apiUrl.includes('sandbox')) {
      environment = 'production';
      // URL de producao e https://api.asaas.com/v3 (SEM /api no meio!)
      urlValid = apiUrl === 'https://api.asaas.com/v3';
      if (!urlValid) {
        urlIssue = `URL de producao incorreta. A URL correta e: https://api.asaas.com/v3 (note que NAO tem /api no meio, diferente do sandbox)`;
      }
    } else {
      environment = 'unknown';
      urlIssue = 'URL nao reconhecida';
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
    rawResponse: '',
  };

  if (apiUrl && apiKey) {
    try {
      // Testar endpoint de customers que e mais simples
      const testResponse = await fetch(`${apiUrl}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
        },
      });

      connectionTest.status = testResponse.status;
      
      // Pegar o texto bruto da resposta
      const responseText = await testResponse.text();
      connectionTest.rawResponse = responseText.substring(0, 500);
      
      if (testResponse.ok) {
        try {
          const data = JSON.parse(responseText);
          connectionTest.success = true;
          connectionTest.message = `Conexao com ASAAS OK. Encontrados ${data.totalCount || 0} clientes.`;
        } catch {
          connectionTest.message = 'Resposta recebida mas nao e JSON valido';
        }
      } else {
        try {
          const errorData = JSON.parse(responseText);
          connectionTest.message = errorData.errors?.[0]?.description || 
                                    errorData.message || 
                                    `Erro HTTP ${testResponse.status}`;
        } catch {
          connectionTest.message = `Erro HTTP ${testResponse.status} - Resposta nao e JSON: ${responseText.substring(0, 200)}`;
        }
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
        issue: urlIssue || undefined,
        correctUrls: {
          production: 'https://api.asaas.com/v3',
          sandbox: 'https://sandbox.asaas.com/api/v3',
        },
      } : {
        configured: false,
        message: 'ASAAS_API_URL nao configurada',
        correctUrls: {
          production: 'https://api.asaas.com/v3',
          sandbox: 'https://sandbox.asaas.com/api/v3',
        },
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
      urlIssue && `ERRO DE URL: ${urlIssue}`,
      !apiUrl && 'Configure ASAAS_API_URL com a URL correta para o ambiente desejado',
      !apiKey && 'Configure ASAAS_API_KEY com sua chave de API do ASAAS',
      environment === 'sandbox' && 'Ambiente sandbox detectado - lembre de mudar para producao quando estiver pronto',
      !connectionTest.success && connectionTest.message,
    ].filter(Boolean),
  });
}
