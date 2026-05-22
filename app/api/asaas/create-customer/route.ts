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

    console.log('[ASAAS] Dados recebidos para criar cliente:', {
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj ? '***' : 'não informado',
      hasAddress: !!data.address,
    });

    // Validação básica
    if (!data.name || !data.email || !data.cpfCnpj) {
      return NextResponse.json(
        { error: 'Nome, email e CPF são obrigatórios' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    // Usar sandbox por padrão se não configurada a URL
    const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    console.log('[ASAAS] Usando API URL:', apiUrl);

    if (!apiKey) {
      console.error('[ASAAS] ASAAS_API_KEY não configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_KEY não configurada no ambiente' },
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

    console.log('[ASAAS] Resposta da API:', {
      status: response.status,
      ok: response.ok,
      result: response.ok ? { id: result.id } : result,
    });

    if (!response.ok) {
      console.error('[ASAAS] Erro ao criar cliente:', JSON.stringify(result, null, 2));
      const errorMessage = result.errors?.[0]?.description || result.errors?.[0]?.detail || result.message || 'Erro ao criar cliente';
      return NextResponse.json(
        { error: errorMessage, details: result },
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
