import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

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

// Funcao para buscar email do cliente no ASAAS
async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const apiKey = process.env.ASAAS_API_KEY;
    const apiUrl = process.env.ASAAS_API_URL;

    if (!apiKey || !apiUrl) {
      console.error('[ASAAS Webhook] API key or URL not configured');
      return null;
    }

    const response = await fetch(`${apiUrl}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    if (!response.ok) {
      console.error('[ASAAS Webhook] Error fetching customer:', response.status);
      return null;
    }

    const customer = await response.json();
    return customer.email || null;
  } catch (error) {
    console.error('[ASAAS Webhook] Error fetching customer email:', error);
    return null;
  }
}

// Funcao para buscar checkout pendente
async function getPendingCheckout(email: string) {
  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `PENDING_CHECKOUT#${email.toLowerCase()}`,
      },
    });

    const result = await docClient.send(getCommand);
    return result.Item || null;
  } catch (error) {
    console.error('[ASAAS Webhook] Error fetching pending checkout:', error);
    return null;
  }
}

// Funcao para registrar checkout confirmado
async function registerConfirmedCheckout(checkoutData: {
  name: string;
  phone: string;
  email: string;
  company: string;
  cpfCnpj: string;
  event: string;
  finalPrice: number;
  paymentId: string;
}) {
  try {
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        [PARTITION_KEY]: `CHECKOUT#${checkoutData.email}#${Date.now()}`,
        ...checkoutData,
        createdAt: new Date().toISOString(),
      },
    });

    await docClient.send(putCommand);
    console.log('[ASAAS Webhook] Checkout registered for:', checkoutData.email);
    return true;
  } catch (error) {
    console.error('[ASAAS Webhook] Error registering checkout:', error);
    return false;
  }
}

// Funcao para deletar checkout pendente
async function deletePendingCheckout(email: string) {
  try {
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `PENDING_CHECKOUT#${email.toLowerCase()}`,
      },
    });

    await docClient.send(deleteCommand);
    console.log('[ASAAS Webhook] Pending checkout deleted for:', email);
  } catch (error) {
    console.error('[ASAAS Webhook] Error deleting pending checkout:', error);
  }
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

      // Buscar email do cliente no ASAAS
      const customerEmail = await getCustomerEmail(payload.payment.customer);
      
      if (customerEmail) {
        console.log('[ASAAS Webhook] Customer email found:', customerEmail);
        
        // Buscar checkout pendente
        const pendingCheckout = await getPendingCheckout(customerEmail);
        
        if (pendingCheckout) {
          console.log('[ASAAS Webhook] Found pending checkout for:', customerEmail);
          
          // Registrar checkout confirmado
          const registered = await registerConfirmedCheckout({
            name: pendingCheckout.name,
            phone: pendingCheckout.phone,
            email: pendingCheckout.email,
            company: pendingCheckout.company,
            cpfCnpj: pendingCheckout.cpfCnpj,
            event: pendingCheckout.event,
            finalPrice: payload.payment.value,
            paymentId: payload.payment.id,
          });
          
          if (registered) {
            // Deletar checkout pendente
            await deletePendingCheckout(customerEmail);
          }
        } else {
          console.log('[ASAAS Webhook] No pending checkout found for:', customerEmail);
        }
      } else {
        console.log('[ASAAS Webhook] Could not get customer email for:', payload.payment.customer);
      }

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
      'https://io.fitgestao.com/webhook/a7f2d898-ed29-458d-93a9-effe55fbf50d';

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
