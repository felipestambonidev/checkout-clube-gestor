import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateCustomer, HolderInfo } from '@/lib/asaas-utils';

interface ChargeBoletoData {
  customerId?: string;
  amount: number;
  description: string;
  dueDate: string;
  holderInfo?: HolderInfo;
  remoteId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ChargeBoletoData = await request.json();

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
    const apiUrl = process.env.ASAAS_API_URL;

    // Verificar se ASAAS_API_URL está configurada
    if (!apiUrl) {
      console.error('[ASAAS BOLETO] ASAAS_API_URL não configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_URL não configurada. Configure a URL da API (sandbox ou produção).' },
        { status: 500 }
      );
    }

    if (!apiKey) {
      console.error('[ASAAS BOLETO] ASAAS_API_KEY não configurada');
      return NextResponse.json(
        { error: 'ASAAS_API_KEY não configurada' },
        { status: 500 }
      );
    }

    console.log('[ASAAS BOLETO] Usando API URL:', apiUrl);
    console.log('[ASAAS BOLETO] API Key presente:', !!apiKey);

    let customerId = data.customerId;

    // Se não tem customerId, criar/buscar cliente pelo holderInfo
    if (!customerId && data.holderInfo) {
      console.log('[ASAAS BOLETO] Criando/buscando cliente...');
      const result = await findOrCreateCustomer(apiUrl, apiKey, data.holderInfo);
      if (result.error) {
        console.error('[ASAAS BOLETO] Erro ao criar cliente:', result.error);
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      customerId = result.customerId;
      console.log('[ASAAS BOLETO] Cliente ID:', customerId);
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o cliente' },
        { status: 400 }
      );
    }

    // Criar cobrança Boleto no ASAAS
    const paymentPayload = {
      customer: customerId,
      billingType: 'BOLETO',
      value: data.amount,
      dueDate: data.dueDate,
      description: data.description,
      remoteId: data.remoteId || `boleto_${Date.now()}`,
    };

    console.log('[ASAAS BOLETO] Criando cobrança:', JSON.stringify(paymentPayload, null, 2));

    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const result = await response.json();

    console.log('[ASAAS BOLETO] Resposta da API:', response.status, JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('[ASAAS BOLETO] Erro ao criar boleto:', JSON.stringify(result, null, 2));
      const errorMessage = result.errors?.[0]?.description || result.errors?.[0]?.detail || result.message || 'Erro ao criar boleto';
      return NextResponse.json(
        { error: errorMessage, details: result },
        { status: response.status }
      );
    }

    console.log('[ASAAS BOLETO] Boleto criado com sucesso:', result.id);

    return NextResponse.json({
      paymentId: result.id,
      customerId: customerId,
      status: result.status,
      boletoUrl: result.bankSlipUrl,
      barcodeNumber: result.identificationField,
    });
  } catch (error) {
    console.error('[ASAAS BOLETO] Erro inesperado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar boleto';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
