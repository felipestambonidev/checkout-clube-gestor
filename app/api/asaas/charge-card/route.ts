import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateCustomer, getCustomerData, HolderInfo } from '@/lib/asaas-utils';

interface ChargeCardData {
  customerId?: string;
  amount: number;
  description: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  holderInfo?: HolderInfo;
  dueDate: string;
  remoteId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ChargeCardData = await request.json();

    // Validação básica
    if (!data.amount || !data.creditCard || !data.creditCard.number) {
      return NextResponse.json(
        { error: 'Dados do cartão incompletos' },
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
    let holderInfo = data.holderInfo;

    // Se não tem customerId, criar/buscar cliente pelo holderInfo
    if (!customerId && holderInfo) {
      const result = await findOrCreateCustomer(apiUrl, apiKey, holderInfo);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      customerId = result.customerId;
    }

    // Se tem customerId mas não tem holderInfo, buscar dados do cliente
    if (customerId && !holderInfo) {
      holderInfo = await getCustomerData(apiUrl, apiKey, customerId) || undefined;
    }

    if (!holderInfo || !holderInfo.cpfCnpj) {
      return NextResponse.json(
        { error: 'Dados do titular do cartao sao obrigatorios' },
        { status: 400 }
      );
    }

    // Remover espaços do número do cartão
    const cardNumber = data.creditCard.number.replace(/\s/g, '');

    // Criar cobrança no ASAAS
    const paymentPayload = {
      customer: customerId,
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
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ''),
        phone: holderInfo.phone?.replace(/\D/g, '') || '',
        mobilePhone: holderInfo.phone?.replace(/\D/g, '') || '',
        address: holderInfo.address,
        addressNumber: holderInfo.addressNumber,
        complement: holderInfo.complement || '',
        province: holderInfo.province,
        city: holderInfo.city || '',
        state: holderInfo.state || '',
        postalCode: holderInfo.postalCode.replace(/\D/g, ''),
      },
    };

    console.log('[ASAAS] Processando pagamento para cliente:', customerId);

    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ASAAS] Erro ao processar cartao:', JSON.stringify(result, null, 2));
      const errorMessage =
        result.errors?.[0]?.description ||
        result.errors?.[0]?.detail ||
        'Erro ao processar cartao';
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    console.log('[ASAAS] Pagamento processado:', result.id, result.status);

    return NextResponse.json({
      paymentId: result.id,
      customerId: customerId,
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
