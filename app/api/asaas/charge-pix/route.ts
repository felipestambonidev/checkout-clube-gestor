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
    const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ASAAS_API_KEY não configurada' },
        { status: 500 }
      );
    }

    let customerId = data.customerId;

    // Se não tem customerId, criar/buscar cliente pelo holderInfo
    if (!customerId && data.holderInfo) {
      const result = await findOrCreateCustomer(apiUrl, apiKey, data.holderInfo);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      customerId = result.customerId;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o cliente' },
        { status: 400 }
      );
    }

    // Criar cobrança PIX no ASAAS
    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: data.amount,
        dueDate: data.dueDate,
        description: data.description,
        remoteId: data.remoteId || `pix_${Date.now()}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ASAAS] Erro ao criar PIX:', result);
      return NextResponse.json(
        { error: result.errors?.[0]?.description || result.errors?.[0]?.detail || 'Erro ao criar PIX' },
        { status: response.status }
      );
    }

    // Gerar QR Code para o PIX
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
    }

    return NextResponse.json({
      paymentId: result.id,
      customerId: customerId,
      status: result.status,
      pixKey: pixCopyPaste,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('[ASAAS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar PIX' },
      { status: 500 }
    );
  }
}
