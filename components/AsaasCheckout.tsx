'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddressForm, { AddressData } from './payment/AddressForm';
import CardPayment from './payment/CardPayment';
import PixPayment from './payment/PixPayment';
import BoletoPayment from './payment/BoletoPayment';

interface CheckoutData {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
}

interface AsaasCheckoutProps {
  amount: number;
  description?: string;
  onCouponApplied?: (discountedAmount: number) => void;
}

type PaymentMethod = 'card' | 'pix' | 'boleto';
type Step = 'address' | 'payment' | 'success';

export default function AsaasCheckout({ amount, description = 'Checkout Clube Gestor', onCouponApplied }: AsaasCheckoutProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('address');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [initialData, setInitialData] = useState<Partial<AddressData>>({});
  const [holderInfo, setHolderInfo] = useState<{
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
  } | null>(null);

  // Carregar dados do checkout do sessionStorage
  useEffect(() => {
    try {
      const checkoutDataStr = sessionStorage.getItem('checkout_data');
      if (checkoutDataStr) {
        const checkoutData: CheckoutData = JSON.parse(checkoutDataStr);
        setInitialData({
          name: checkoutData.name || '',
          email: checkoutData.email || '',
          cpf: checkoutData.cpfCnpj || '',
          phone: checkoutData.phone || '',
        });
      }
    } catch (err) {
      console.error('[AsaasCheckout] Erro ao carregar dados:', err);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  const handleAddressSubmit = async (addressData: AddressData) => {
    setLoading(true);
    setError('');

    try {
      // Mapear dados do formulário para o formato do holderInfo
      const holderData = {
        name: addressData.name,
        email: addressData.email,
        cpfCnpj: addressData.cpf,
        phone: addressData.phone,
        address: addressData.address,
        addressNumber: addressData.addressNumber,
        complement: addressData.complement,
        province: addressData.province,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
      };

      // Salvar holderInfo para usar no pagamento
      setHolderInfo(holderData);

      // Tentar criar cliente no ASAAS (opcional, pois o charge-card também pode criar)
      try {
        const response = await fetch('/api/asaas/create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(holderData),
        });

        const result = await response.json();

        if (response.ok && result.customerId) {
          setCustomerId(result.customerId);
        }
      } catch (err) {
        // Se falhar, o charge-card criará o cliente
        console.log('[AsaasCheckout] Cliente será criado no pagamento');
      }

      setStep('payment');
    } catch (err) {
      setError('Erro ao processar dados');
      console.error('[AsaasCheckout] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (pId: string) => {
    setPaymentId(pId);
    setStep('success');

    // Redirecionar para página de obrigado após 2 segundos
    setTimeout(() => {
      router.push(`/obrigado?paymentId=${pId}`);
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h2 className="text-2xl font-bold text-green-700">Pagamento Realizado!</h2>
          <p className="text-green-600">
            Obrigado por sua compra. Você será redirecionado em breve...
          </p>
        </div>
      </div>
    );
  }

  // Aguardar carregamento dos dados antes de renderizar
  if (!dataLoaded) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-600">Valor a pagar</p>
            <p className="text-3xl font-bold text-gray-900">
              R$ {amount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Valor a pagar</p>
              <p className="text-3xl font-bold text-gray-900">
                R$ {amount.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setStep('address')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Payment Method Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="grid grid-cols-3 border-b border-gray-200">
            <button
              onClick={() => {
                setPaymentMethod('card');
                setError('');
              }}
              className={`py-4 px-6 font-medium text-center transition-colors ${
                paymentMethod === 'card'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💳 Cartão
            </button>
            <button
              onClick={() => {
                setPaymentMethod('pix');
                setError('');
              }}
              className={`py-4 px-6 font-medium text-center transition-colors ${
                paymentMethod === 'pix'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔑 PIX
            </button>
            <button
              onClick={() => {
                setPaymentMethod('boleto');
                setError('');
              }}
              className={`py-4 px-6 font-medium text-center transition-colors ${
                paymentMethod === 'boleto'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📄 Boleto
            </button>
          </div>

          {/* Payment Forms */}
          <div className="p-6">
            {paymentMethod === 'card' && (
              <CardPayment
                amount={amount}
                description={description}
                customerId={customerId || undefined}
                holderInfo={holderInfo || undefined}
                onPaymentSuccess={handlePaymentSuccess}
                isLoading={loading}
              />
            )}
            {paymentMethod === 'pix' && (
              <PixPayment
                amount={amount}
                description={description}
                customerId={customerId || undefined}
                holderInfo={holderInfo || undefined}
                onPaymentSuccess={handlePaymentSuccess}
                isLoading={loading}
              />
            )}
            {paymentMethod === 'boleto' && (
              <BoletoPayment
                amount={amount}
                description={description}
                customerId={customerId || undefined}
                holderInfo={holderInfo || undefined}
                onPaymentSuccess={handlePaymentSuccess}
                isLoading={loading}
              />
            )}
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600">
          <p>🔐 Todos os dados são criptografados e processados com segurança total</p>
          <p className="text-xs text-gray-500 mt-1">Em conformidade com LGPD e PCI DSS</p>
        </div>
      </div>
    );
  }

  // Address form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div>
          <p className="text-sm text-gray-600">Valor a pagar</p>
          <p className="text-3xl font-bold text-gray-900">
            R$ {amount.toFixed(2)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Address Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Dados de pagamento</h2>
        <AddressForm 
          key={`address-form-${initialData.email || 'empty'}`}
          onSubmit={handleAddressSubmit} 
          isLoading={loading} 
          initialData={initialData} 
        />
      </div>

      {/* Security Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600">
        <p>🔐 Seus dados estão totalmente protegidos</p>
        <p className="text-xs text-gray-500 mt-1">LGPD • PCI DSS • Criptografia SSL/TLS</p>
      </div>
    </div>
  );
}
