export interface CEPData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressFromCEP(cep: string): Promise<CEPData | null> {
  try {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return null;
    }

    const response = await fetch(
      `https://viacep.com.br/ws/${cleanCep}/json/`
    );

    if (!response.ok) {
      return null;
    }

    const data: CEPData = await response.json();

    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[ViaCEP] Erro:', error);
    return null;
  }
}

export function formatCEP(cep: string): string {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length === 8) {
    return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
  }
  return cep;
}
