'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddressForm, { AddressData } from './payment/AddressForm';
import CardPayment from './payment/CardPayment';
import PixPayment from './payment/PixPayment';
import BoletoPayment from './payment/BoletoPayment';

interface AsaasCheckoutProps {
  amount: number;
  onCouponApplied?: (discountedAmount: number) => void;
}

type PaymentMethod = 'card' | 'pix' | 'boleto';
type Step = 'address' | 'payment' | 'success';

export default function AsaasCheckout({ amount, onCouponApplied }: AsaasCheckoutProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('address');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const handleAddressSubmit = async (addressData: AddressData) => {
    setLoading(true);
    setError('');

    try {
      // Criar cliente no ASAAS
      const response = await fetch('/api/asaas/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao processar informações');
        return;
      }

      setCustomerId(result.customerId);
      setStep('payment');
    } catch (err) {
      setError('Erro ao conectar com servidor');
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
                customerId={customerId}
                onPaymentSuccess={handlePaymentSuccess}
                isLoading={loading}
              />
            )}
            {paymentMethod === 'pix' && (
              <PixPayment
                amount={amount}
                customerId={customerId}
                onPaymentSuccess={handlePaymentSuccess}
                isLoading={loading}
              />
            )}
            {paymentMethod === 'boleto' && (
              <BoletoPayment
                amount={amount}
                customerId={customerId}
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
        <h2 className="text-xl font-bold mb-6">Endereço de Entrega</h2>
        <AddressForm onSubmit={handleAddressSubmit} isLoading={loading} />
      </div>

      {/* Security Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600">
        <p>🔐 Seus dados estão totalmente protegidos</p>
        <p className="text-xs text-gray-500 mt-1">LGPD • PCI DSS • Criptografia SSL/TLS</p>
      </div>
    </div>
  );
}
