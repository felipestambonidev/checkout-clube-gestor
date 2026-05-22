'use client';

import { useState } from 'react';

interface ConfigResult {
  ASAAS_API_KEY: boolean;
  ASAAS_WEBHOOK_TOKEN: boolean;
  ASAAS_API_URL: string;
  apiKeyPreview: string | null;
}

export default function TestAsaasPage() {
  const [testResults, setTestResults] = useState<Array<{ name: string; success: boolean; message: string }>>([]);
  const [configData, setConfigData] = useState<ConfigResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = [];

    // Test 0: Verificar configuração
    try {
      const configResponse = await fetch('/api/asaas/check-config');
      const config: ConfigResult = await configResponse.json();
      setConfigData(config);

      results.push({
        name: 'Configuração de Variáveis',
        success: config.ASAAS_API_KEY && config.ASAAS_WEBHOOK_TOKEN,
        message: config.ASAAS_API_KEY 
          ? `API Key: ${config.apiKeyPreview} | Token: ${config.ASAAS_WEBHOOK_TOKEN ? 'OK' : 'Faltando'} | URL: ${config.ASAAS_API_URL}` 
          : 'ASAAS_API_KEY não configurada nas variáveis de ambiente do Vercel',
      });
    } catch (error) {
      results.push({
        name: 'Configuração de Variáveis',
        success: false,
        message: 'Erro ao verificar configuração',
      });
    }

    // Test 1: Verificar se variáveis estão configuradas (usando API real)
    try {
      const response = await fetch('/api/asaas/check-payment?paymentId=test');
      const data = await response.json();
      const success = response.status !== 500;
      results.push({
        name: 'Acesso à API ASAAS',
        success,
        message: success 
          ? 'API acessível (pagamento não encontrado é esperado)' 
          : `Erro: ${data.error || 'Verifique ASAAS_API_KEY'}`,
      });
    } catch (error) {
      results.push({
        name: 'Acesso à API ASAAS',
        success: false,
        message: 'Erro ao conectar com API',
      });
    }

    // Test 2: Criar cliente de teste (sem telefone para evitar erro de validação)
    try {
      const response = await fetch('/api/asaas/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente Teste v0',
          email: `teste${Date.now()}@example.com`,
          cpfCnpj: '24971563792',
          address: 'Avenida Paulista',
          addressNumber: '1000',
          province: 'Bela Vista',
          postalCode: '01310100',
        }),
      });

      const data = await response.json();
      results.push({
        name: 'Criar Cliente ASAAS',
        success: response.ok,
        message: response.ok 
          ? `Cliente criado: ${data.customerId}` 
          : data.error || 'Erro ao criar cliente',
      });
    } catch (error) {
      results.push({
        name: 'Criar Cliente ASAAS',
        success: false,
        message: 'Erro na requisição',
      });
    }

    // Test 3: Webhook Token Validation
    try {
      const response = await fetch('/api/webhooks/asaas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-asaas-access-token': 'invalid_token',
        },
        body: JSON.stringify({
          event: 'payment_received',
          payment: { id: 'test' },
        }),
      });

      const success = response.status === 401;
      results.push({
        name: 'Validação Token Webhook',
        success,
        message: success 
          ? 'Token inválido rejeitado corretamente' 
          : 'Token deveria ter sido rejeitado',
      });
    } catch (error) {
      results.push({
        name: 'Validação Token Webhook',
        success: false,
        message: 'Erro na requisição',
      });
    }

    // Test 4: ViaCEP Integration (usando CEP válido da Av. Paulista)
    try {
      const response = await fetch('https://viacep.com.br/ws/01310100/json/');
      const data = await response.json();
      const success = !data.erro && data.localidade;
      results.push({
        name: 'ViaCEP Integration',
        success,
        message: success 
          ? `CEP válido: ${data.logradouro}, ${data.localidade}/${data.uf}` 
          : 'CEP inválido ou indisponível',
      });
    } catch (error) {
      results.push({
        name: 'ViaCEP Integration',
        success: false,
        message: 'Erro ao conectar com ViaCEP',
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Testes - ASAAS Checkout</h1>

        <button
          onClick={runTests}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 mb-8"
        >
          {loading ? 'Executando testes...' : 'Executar Testes'}
        </button>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {result.success ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.name}
                  </h3>
                  <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {testResults.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Próximos Passos:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. Se houver erros, verifique as variáveis de ambiente</li>
              <li>2. Teste o formulário completo em <code>/</code></li>
              <li>3. Verifique os logs no console do navegador</li>
              <li>4. Consulte ASAAS_SETUP.md para troubleshooting</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
