import { NextRequest, NextResponse } from 'next/server';

interface ChargeBoletoData {
  customerId: string;
  amount: number;
  description: string;
  dueDate: string;
  remoteId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ChargeBoletoData = await request.json();

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

    // Criar cobrança Boleto no ASAAS
    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        customer: data.customerId,
        billingType: 'BOLETO',
        value: data.amount,
        dueDate: data.dueDate,
        description: data.description,
        remoteId: data.remoteId || `boleto_${Date.now()}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ASAAS] Erro ao criar boleto:', result);
      return NextResponse.json(
        { error: result.errors?.[0]?.detail || 'Erro ao criar boleto' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      paymentId: result.id,
      status: result.status,
      boletoUrl: result.url,
      barcodeNumber: result.boletoNumber,
    });
  } catch (error) {
    console.error('[ASAAS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar boleto' },
      { status: 500 }
    );
  }
}
