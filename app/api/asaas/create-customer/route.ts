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
    const apiUrl = process.env.ASAAS_API_URL;

    // Verificar se ASAAS_API_URL está configurada
    if (!apiUrl) {
      console.error('[ASAAS CUSTOMER] ASAAS_API_URL não configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_URL não configurada. Configure a URL da API (sandbox ou produção).' },
        { status: 500 }
      );
    }

    console.log('[ASAAS CUSTOMER] API URL:', apiUrl);
    console.log('[ASAAS CUSTOMER] API Key presente:', !!apiKey);

    if (!apiKey) {
      console.error('[ASAAS] ASAAS_API_KEY não está configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_KEY não configurada. Verifique as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    // Formatar telefone - ASAAS exige 10 ou 11 dígitos (DDD + número)
    const formatPhone = (phone?: string) => {
      if (!phone) return undefined;
      const cleanPhone = phone.replace(/\D/g, '');
      // Se tiver 11 dígitos (celular com 9), retorna como está
      // Se tiver 10 dígitos (fixo), retorna como está
      // Senão, retorna undefined para não enviar campo inválido
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        return cleanPhone;
      }
      return undefined;
    };

    const formattedPhone = formatPhone(data.phone);
    const formattedMobilePhone = formatPhone(data.mobilePhone) || formattedPhone;

    // Criar cliente no ASAAS
    console.log('[ASAAS] Criando cliente com dados:', {
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, '').substring(0, 3) + '***',
      phone: formattedPhone,
    });

    const customerPayload: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement || undefined,
      province: data.province,
      postalCode: data.postalCode.replace(/\D/g, ''),
    };

    // Só adiciona telefone se for válido
    if (formattedPhone) {
      customerPayload.phone = formattedPhone;
    }
    if (formattedMobilePhone) {
      customerPayload.mobilePhone = formattedMobilePhone;
    }

    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(customerPayload),
    });

    const result = await response.json();

    console.log('[ASAAS] Resposta:', response.status, JSON.stringify(result).substring(0, 200));

    if (!response.ok) {
      console.error('[ASAAS] Erro ao criar cliente:', result);
      return NextResponse.json(
        { error: result.errors?.[0]?.description || result.errors?.[0]?.detail || 'Erro ao criar cliente' },
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
