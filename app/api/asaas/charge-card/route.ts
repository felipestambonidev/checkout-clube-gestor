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
  // Dados do titular para creditCardHolderInfo (obrigatório no ASAAS)
  holderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    address: string;
    addressNumber: string;
    complement?: string;
    province: string;
    city?: string;
    state?: string;
    postalCode: string;
  };
  billingType?: 'CREDIT_CARD';
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

    // Preparar creditCardHolderInfo - obrigatório para cobrança com cartão no ASAAS
    // Se não tiver holderInfo, buscar dados do cliente
    let holderInfo = data.holderInfo;
    
    if (!holderInfo) {
      // Buscar dados do cliente no ASAAS
      const customerResponse = await fetch(`${apiUrl}/customers/${data.customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
        },
      });
      
      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        holderInfo = {
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj,
          phone: customer.phone || customer.mobilePhone,
          address: customer.address || 'Não informado',
          addressNumber: customer.addressNumber || 'S/N',
          province: customer.province || 'Centro',
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
        };
      }
    }

    if (!holderInfo || !holderInfo.cpfCnpj) {
      return NextResponse.json(
        { error: 'Dados do titular do cartão são obrigatórios' },
        { status: 400 }
      );
    }

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
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ASAAS] Erro ao processar cartão:', JSON.stringify(result, null, 2));
      const errorMessage = result.errors?.[0]?.description || 
                          result.errors?.[0]?.detail || 
                          'Erro ao processar cartão';
      return NextResponse.json(
        { error: errorMessage },
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
