import { NextRequest, NextResponse } from 'next/server';

interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    customer: string;
    subscription: string;
    paymentDate: string;
    value: number;
    netValue: number;
    grossValue: number;
    status: string;
    description: string;
    billingType: string;
    refundedAmount: number;
    pixTransaction: string;
    creditDate: string;
    estimatedCreditDate: string;
    confirmedDate: string;
    transactionReceiptUrl: string;
    invoiceUrl: string;
    bankSlipUrl: string;
    invoiceNumber: string;
    externalReference: string;
    deleted: boolean;
    anticipated: boolean;
    anticipatedBy: string;
    createdDate: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar token do webhook
    const token = request.headers.get('x-asaas-access-token');
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!webhookToken || token !== webhookToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const payload: AsaasWebhookPayload = await request.json();

    console.log('[ASAAS Webhook] Evento recebido:', payload.event, 'Payment:', payload.payment?.id);

    // Processar diferentes eventos
    if (
      payload.event === 'payment_received' ||
      payload.event === 'payment_confirmed' ||
      payload.event === 'payment_approved'
    ) {
      // Pagamento confirmado
      console.log('[ASAAS Webhook] Pagamento confirmado:', payload.payment.id);

      // Salvar informações do pagamento no DynamoDB (opcional)
      // Disparar webhook para n8n com dados da transação
      await notifyN8n(payload.payment);
    } else if (payload.event === 'payment_overdue') {
      console.log('[ASAAS Webhook] Pagamento vencido:', payload.payment.id);
    } else if (payload.event === 'payment_deleted') {
      console.log('[ASAAS Webhook] Pagamento deletado:', payload.payment.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ASAAS Webhook] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

async function notifyN8n(payment: AsaasWebhookPayload['payment']) {
  try {
    // Webhook específico para pagamentos ASAAS (sem cupom)
    // Use a variável de ambiente ou a URL fixa de teste/produção
    const n8nPaymentWebhookUrl = process.env.N8N_PAYMENT_WEBHOOK_URL || 
      'https://io.fitgestao.com/webhook-test/a7f2d898-ed29-458d-93a9-effe55fbf50d';

    console.log('[N8N Payment] Enviando para:', n8nPaymentWebhookUrl);
    console.log('[N8N Payment] Descrição do pagamento:', payment.description);

    const response = await fetch(n8nPaymentWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'asaas_payment_confirmed',
        paymentId: payment.id,
        customerId: payment.customer,
        status: payment.status,
        value: payment.value,
        billingType: payment.billingType,
        description: payment.description,
        paymentDate: payment.paymentDate,
        externalReference: payment.externalReference,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('[N8N Payment] Erro ao notificar:', response.status);
    } else {
      console.log('[N8N Payment] Notificação enviada com sucesso');
    }
  } catch (error) {
    console.error('[N8N Payment] Erro ao enviar notificação:', error);
  }
}
