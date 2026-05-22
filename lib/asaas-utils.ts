// Utilitários compartilhados para APIs do ASAAS

// Funcao auxiliar para fazer parse seguro de JSON
export async function safeJsonParse(response: Response): Promise<{ data: unknown; error?: string }> {
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    return { 
      data: null, 
      error: `Resposta vazia do servidor (status: ${response.status})` 
    };
  }
  
  try {
    const data = JSON.parse(text);
    return { data };
  } catch {
    console.error('[ASAAS] Resposta nao e JSON valido:', text.substring(0, 500));
    return { 
      data: null, 
      error: `Resposta invalida do servidor: ${text.substring(0, 200)}` 
    };
  }
}

export interface HolderInfo {
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
}

export async function findOrCreateCustomer(
  apiUrl: string,
  apiKey: string,
  holderInfo: HolderInfo
): Promise<{ customerId: string; error?: string }> {
  const cpfCnpj = holderInfo.cpfCnpj.replace(/\D/g, '');

  console.log('[ASAAS UTILS] Buscando cliente por CPF/CNPJ:', cpfCnpj.substring(0, 3) + '***');
  console.log('[ASAAS UTILS] API URL:', apiUrl);

  // 1. Buscar cliente existente pelo CPF/CNPJ
  try {
    const searchResponse = await fetch(`${apiUrl}/customers?cpfCnpj=${cpfCnpj}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    console.log('[ASAAS UTILS] Resposta busca cliente:', searchResponse.status);

    const { data: searchResult, error: parseError } = await safeJsonParse(searchResponse);
    
    if (parseError) {
      console.error('[ASAAS UTILS] Erro ao parsear resposta:', parseError);
    } else if (searchResponse.ok && searchResult) {
      const result = searchResult as { data?: Array<{ id: string }> };
      if (result.data && result.data.length > 0) {
        console.log('[ASAAS UTILS] Cliente encontrado:', result.data[0].id);
        return { customerId: result.data[0].id };
      }
    } else if (!searchResponse.ok) {
      console.error('[ASAAS UTILS] Erro ao buscar cliente:', JSON.stringify(searchResult, null, 2));
    }
  } catch (err) {
    console.error('[ASAAS UTILS] Erro ao buscar cliente:', err);
  }

  // 2. Cliente não existe, criar novo
  console.log('[ASAAS UTILS] Criando novo cliente...');

  const formatPhone = (phone?: string) => {
    if (!phone) return undefined;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 || cleaned.length === 11) {
      return cleaned;
    }
    return undefined;
  };

  const customerPayload: Record<string, unknown> = {
    name: holderInfo.name,
    email: holderInfo.email,
    cpfCnpj: cpfCnpj,
    address: holderInfo.address,
    addressNumber: holderInfo.addressNumber,
    complement: holderInfo.complement || undefined,
    province: holderInfo.province,
    postalCode: holderInfo.postalCode.replace(/\D/g, ''),
  };

  const formattedPhone = formatPhone(holderInfo.phone);
  if (formattedPhone) {
    customerPayload.phone = formattedPhone;
    customerPayload.mobilePhone = formattedPhone;
  }

  console.log('[ASAAS UTILS] Payload do cliente:', JSON.stringify(customerPayload, null, 2));

  const createResponse = await fetch(`${apiUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: JSON.stringify(customerPayload),
  });

  const { data: createResult, error: parseError } = await safeJsonParse(createResponse);

  console.log('[ASAAS UTILS] Resposta criar cliente:', createResponse.status, JSON.stringify(createResult, null, 2));

  if (parseError) {
    console.error('[ASAAS UTILS] Erro ao parsear resposta:', parseError);
    return {
      customerId: '',
      error: parseError,
    };
  }

  if (!createResponse.ok) {
    const result = createResult as { errors?: Array<{ description?: string }>; message?: string };
    console.error('[ASAAS UTILS] Erro ao criar cliente:', JSON.stringify(createResult, null, 2));
    const errorMessage = result?.errors?.[0]?.description || result?.message || 'Erro ao cadastrar cliente';
    return {
      customerId: '',
      error: errorMessage,
    };
  }

  const result = createResult as { id: string };
  console.log('[ASAAS UTILS] Cliente criado:', result.id);
  return { customerId: result.id };
}

export async function getCustomerData(
  apiUrl: string,
  apiKey: string,
  customerId: string
): Promise<HolderInfo | null> {
  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    if (response.ok) {
      const customer = await response.json();
      return {
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj,
        phone: customer.phone || customer.mobilePhone,
        address: customer.address || 'Nao informado',
        addressNumber: customer.addressNumber || 'S/N',
        province: customer.province || 'Centro',
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
      };
    }
  } catch (err) {
    console.error('[ASAAS] Erro ao buscar dados do cliente:', err);
  }
  return null;
}
