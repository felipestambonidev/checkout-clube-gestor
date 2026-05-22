import { NextRequest, NextResponse } from 'next/server';

interface ChargeCardData {
  customerId: string;
  amount: number;
  description: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  billingType: 'CREDIT_CARD';
  dueDate: string;
  remoteId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ChargeCardData = await request.json();

    // Validação
    if (
      !data.customerId ||
      !data.amount ||
      !data.creditCard ||
      !data.creditCard.number ||
      !data.creditCard.holderName
    ) {
      return NextResponse.json(
        { error: 'Dados do cartão incompletos' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    if (!apiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // Remover espaços e caracteres especiais do número do cartão
    const cardNumber = data.creditCard.number.replace(/\s/g, '');

    // Criar cobrança no ASAAS
    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        customer: data.customerId,
        billingType: 'CREDIT_CARD',
        value: data.amount,
        dueDate: data.dueDate,
        description: data.description,
        remoteId: data.remoteId || `charge_${Date.now()}`,
        creditCard: {
          holderName: data.creditCard.holderName,
          number: cardNumber,
          expiryMonth: data.creditCard.expiryMonth.padStart(2, '0'),
          expiryYear: data.creditCard.expiryYear,
          ccv: data.creditCard.ccv,
        },
        creditCardHolderInfo: {
          name: data.creditCard.holderName,
          email: '', // Preenchido pela integração
          cpfCnpj: '', // Já no cliente
          phone: '', // Já no cliente
          mobilePhone: '', // Já no cliente
          address: '', // Já no cliente
          addressNumber: '', // Já no cliente
          province: '', // Já no cliente
          city: '', // Já no cliente
          state: '', // Já no cliente
          postalCode: '', // Já no cliente
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ASAAS] Erro ao processar cartão:', result);
      return NextResponse.json(
        { error: result.errors?.[0]?.detail || 'Erro ao processar cartão' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      paymentId: result.id,
      status: result.status,
    });
  } catch (error) {
    console.error('[ASAAS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
