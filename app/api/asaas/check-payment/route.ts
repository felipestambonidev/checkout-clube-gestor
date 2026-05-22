import { NextRequest, NextResponse } from 'next/server';

interface CheckPaymentQuery {
  paymentId: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId é obrigatório' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    const apiUrl = process.env.ASAAS_API_URL;

    // Verificar se ASAAS_API_URL está configurada
    if (!apiUrl) {
      console.error('[ASAAS CHECK] ASAAS_API_URL não configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_URL não configurada. Configure a URL da API (sandbox ou produção).' },
        { status: 500 }
      );
    }

    console.log('[ASAAS CHECK] API URL:', apiUrl);
    console.log('[ASAAS CHECK] API Key presente:', !!apiKey);

    if (!apiKey) {
      console.error('[ASAAS] ASAAS_API_KEY não está configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_KEY não configurada. Verifique as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    // Verificar status do pagamento
    const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ASAAS] Erro ao verificar pagamento:', result);
      return NextResponse.json(
        { error: 'Erro ao verificar pagamento' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      paymentId: result.id,
      status: result.status,
      value: result.value,
      billingType: result.billingType,
    });
  } catch (error) {
    console.error('[ASAAS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
