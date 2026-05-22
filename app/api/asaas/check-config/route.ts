import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASAAS_API_KEY;
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

  // Nao expor valores, apenas verificar se existem
  const config = {
    ASAAS_API_KEY: !!apiKey,
    ASAAS_WEBHOOK_TOKEN: !!webhookToken,
    ASAAS_API_URL: apiUrl,
    // REMOVIDO: Preview da API key por seguranca
  };

  return NextResponse.json(config);
}
