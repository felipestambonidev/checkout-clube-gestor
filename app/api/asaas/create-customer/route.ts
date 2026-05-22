import { NextRequest, NextResponse } from 'next/server';

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  city: string;
  state: string;
  postalCode: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: CustomerData = await request.json();

    // Validação básica
    if (!data.name || !data.email || !data.cpfCnpj) {
      return NextResponse.json(
        { error: 'Nome, email e CPF são obrigatórios' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    // URL fixa do sandbox - pode ser alterada para produção via env var
    const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    console.log('[ASAAS] API URL:', apiUrl);
    console.log('[ASAAS] API Key presente:', !!apiKey);

    if (!apiKey) {
      console.error('[ASAAS] ASAAS_API_KEY não está configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_KEY não configurada. Verifique as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    // Criar cliente no ASAAS
    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
        phone: data.phone?.replace(/\D/g, ''),
        mobilePhone: data.mobilePhone?.replace(/\D/g, ''),
        address: data.address,
        addressNumber: data.addressNumber,
        complement: data.complement || '',
        province: data.province,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode.replace(/\D/g, ''),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ASAAS] Erro ao criar cliente:', result);
      return NextResponse.json(
        { error: result.errors?.[0]?.detail || 'Erro ao criar cliente' },
        { status: response.status }
      );
    }

    return NextResponse.json({ customerId: result.id });
  } catch (error) {
    console.error('[ASAAS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
