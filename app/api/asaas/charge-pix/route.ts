import { NextRequest, NextResponse } from 'next/server';

interface ChargePixData {
  customerId: string;
  amount: number;
  description: string;
  dueDate: string;
  remoteId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ChargePixData = await request.json();

    // Validação
    if (!data.customerId || !data.amount) {
      return NextResponse.json(
        { error: 'Cliente e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    if (!apiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // Criar cobrança PIX no ASAAS
    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        customer: data.customerId,
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
        { error: result.errors?.[0]?.detail || 'Erro ao criar PIX' },
        { status: response.status }
      );
    }

    // Gerar QR Code para o PIX
    const qrCodeResponse = await fetch(
      `${apiUrl}/payments/${result.id}/qrCode/image`,
      {
        method: 'GET',
        headers: {
          'access_token': apiKey,
        },
      }
    );

    let qrCodeUrl = '';
    if (qrCodeResponse.ok) {
      const qrCodeData = await qrCodeResponse.json();
      qrCodeUrl = qrCodeData.image || '';
    }

    return NextResponse.json({
      paymentId: result.id,
      status: result.status,
      pixKey: result.pixQrCode,
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
