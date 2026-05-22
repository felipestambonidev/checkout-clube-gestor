import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASAAS_API_KEY;
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const apiUrl = process.env.ASAAS_API_URL;

  // Detectar ambiente baseado na URL
  let environment = 'not_configured';
  if (apiUrl) {
    if (apiUrl.includes('sandbox')) {
      environment = 'sandbox';
    } else if (apiUrl.includes('api.asaas.com')) {
      environment = 'production';
    }
  }

  // Nao expor valores, apenas verificar se existem
  const config = {
    ASAAS_API_KEY: !!apiKey,
    ASAAS_WEBHOOK_TOKEN: !!webhookToken,
    ASAAS_API_URL: apiUrl || 'NOT_CONFIGURED',
    environment,
    message: !apiUrl 
      ? 'ASAAS_API_URL precisa ser configurada. Use https://sandbox.asaas.com/api/v3 para sandbox ou https://api.asaas.com/api/v3 para producao.'
      : undefined,
  };

  return NextResponse.json(config);
}
