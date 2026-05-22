import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateCustomer, getCustomerData, HolderInfo } from '@/lib/asaas-utils';

interface ChargePixData {
  customerId?: string;
  amount: number;
  description: string;
  dueDate: string;
  holderInfo?: HolderInfo;
  remoteId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ChargePixData = await request.json();

    // Validação
    if (!data.amount) {
      return NextResponse.json(
        { error: 'Valor é obrigatório' },
        { status: 400 }
      );
    }

    // Precisa ter customerId ou holderInfo
    if (!data.customerId && !data.holderInfo) {
      return NextResponse.json(
        { error: 'Informe customerId ou holderInfo com dados do comprador' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    const apiUrl = process.env.ASAAS_API_URL;

    // Verificar se ASAAS_API_URL está configurada
    if (!apiUrl) {
      console.error('[ASAAS PIX] ASAAS_API_URL não configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_URL não configurada. Configure a URL da API (sandbox ou produção).' },
        { status: 500 }
      );
    }

    if (!apiKey) {
      console.error('[ASAAS PIX] ASAAS_API_KEY não configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_KEY não configurada' },
        { status: 500 }
      );
    }

    console.log('[ASAAS PIX] Usando API URL:', apiUrl);
    console.log('[ASAAS PIX] API Key presente:', !!apiKey);

    let customerId = data.customerId;

    // Se não tem customerId, criar/buscar cliente pelo holderInfo
    if (!customerId && data.holderInfo) {
      console.log('[ASAAS PIX] Criando/buscando cliente...');
      const result = await findOrCreateCustomer(apiUrl, apiKey, data.holderInfo);
      if (result.error) {
        console.error('[ASAAS PIX] Erro ao criar cliente:', result.error);
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      customerId = result.customerId;
      console.log('[ASAAS PIX] Cliente ID:', customerId);
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o cliente' },
        { status: 400 }
      );
    }

    // Criar cobrança PIX no ASAAS
    const paymentPayload = {
      customer: customerId,
      billingType: 'PIX',
      value: data.amount,
      dueDate: data.dueDate,
      description: data.description,
      remoteId: data.remoteId || `pix_${Date.now()}`,
    };

    console.log('[ASAAS PIX] Criando cobrança PIX:', JSON.stringify(paymentPayload, null, 2));

    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const result = await response.json();

    console.log('[ASAAS PIX] Resposta da API:', response.status, JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('[ASAAS PIX] Erro ao criar PIX:', JSON.stringify(result, null, 2));
      const errorMessage = result.errors?.[0]?.description || result.errors?.[0]?.detail || result.message || 'Erro ao criar PIX';
      return NextResponse.json(
        { error: errorMessage, details: result },
        { status: response.status }
      );
    }

    // Gerar QR Code para o PIX
    console.log('[ASAAS PIX] Buscando QR Code para pagamento:', result.id);
    const qrCodeResponse = await fetch(
      `${apiUrl}/payments/${result.id}/pixQrCode`,
      {
        method: 'GET',
        headers: {
          'access_token': apiKey,
        },
      }
    );

    let qrCodeUrl = '';
    let pixCopyPaste = '';
    if (qrCodeResponse.ok) {
      const qrCodeData = await qrCodeResponse.json();
      qrCodeUrl = qrCodeData.encodedImage ? `data:image/png;base64,${qrCodeData.encodedImage}` : '';
      pixCopyPaste = qrCodeData.payload || '';
      console.log('[ASAAS PIX] QR Code gerado com sucesso');
    } else {
      const qrCodeError = await qrCodeResponse.json();
      console.error('[ASAAS PIX] Erro ao gerar QR Code:', JSON.stringify(qrCodeError, null, 2));
    }

    return NextResponse.json({
      paymentId: result.id,
      customerId: customerId,
      status: result.status,
      pixKey: pixCopyPaste,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('[ASAAS PIX] Erro inesperado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar PIX';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
