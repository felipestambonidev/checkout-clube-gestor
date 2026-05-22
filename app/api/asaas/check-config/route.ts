import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASAAS_API_KEY;
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

  // Não expor valores, apenas verificar se existem
  const config = {
    ASAAS_API_KEY: !!apiKey,
    ASAAS_WEBHOOK_TOKEN: !!webhookToken,
    ASAAS_API_URL: apiUrl,
    // Mostrar apenas os primeiros 10 caracteres da API key para debug (se existir)
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : null,
  };

  return NextResponse.json(config);
}
