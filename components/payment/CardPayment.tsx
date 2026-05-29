'use client';

import { useState } from 'react';

interface HolderInfo {
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

interface CardPaymentProps {
  amount: number;
  description?: string;
  onPaymentSuccess: (paymentId: string) => void;
  isLoading?: boolean;
  customerId?: string; // Agora opcional
  holderInfo?: HolderInfo; // Dados do comprador
}

export default function CardPayment({
  amount,
  description = 'Checkout Clube Gestor',
  onPaymentSuccess,
  isLoading = false,
  customerId,
  holderInfo,
}: CardPaymentProps) {
  const [cardData, setCardData] = useState({
    holderName: holderInfo?.name || '',
    number: '',
    expiry: '',
    ccv: '',
  });

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.slice(0, 19);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardData(prev => ({
      ...prev,
      number: formatCardNumber(e.target.value),
    }));
    setError('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limita a 4 digitos (MMAA)
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    
    // Formata como MM/AA
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    
    setCardData(prev => ({ ...prev, expiry: value }));
    setError('');
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardData(prev => ({
      ...prev,
      ccv: e.target.value.replace(/\D/g, '').slice(0, 4),
    }));
    setError('');
  };

  const validateCard = (): boolean => {
    if (!cardData.holderName.trim()) {
      setError('Nome do titular é obrigatório');
      return false;
    }

    const cardNumber = cardData.number.replace(/\s/g, '');
    if (cardNumber.length < 13) {
      setError('Número do cartão inválido');
      return false;
    }

    // Validar formato MM/AA
    const expiryParts = cardData.expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setError('Data de validade inválida (use MM/AA)');
      return false;
    }

    const month = parseInt(expiryParts[0], 10);
    if (month < 1 || month > 12) {
      setError('Mês de validade inválido');
      return false;
    }

    if (cardData.ccv.length < 3) {
      setError('CVV inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCard()) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      // Extrair mês e ano da validade
      const expiryParts = cardData.expiry.split('/');
      const expiryMonth = expiryParts[0];
      const expiryYear = expiryParts[1];

      const response = await fetch('/api/asaas/charge-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          holderInfo: holderInfo || undefined,
          amount,
          description,
          dueDate,
          creditCard: {
            holderName: cardData.holderName,
            number: cardData.number.replace(/\s/g, ''),
            expiryMonth,
            expiryYear,
            ccv: cardData.ccv,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao processar pagamento');
      } else {
        onPaymentSuccess(result.paymentId);
      }
    } catch (err) {
      setError('Erro ao conectar com servidor');
      console.error('[CardPayment] Erro:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Titular do Cartão */}
      <div>
        <label htmlFor="holderName" className="block text-sm font-medium mb-1">
          Nome do Titular
        </label>
        <input
          id="holderName"
          type="text"
          value={cardData.holderName}
          onChange={(e) => {
            setCardData(prev => ({ ...prev, holderName: e.target.value }));
            setError('');
          }}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${holderInfo?.name ? 'bg-gray-100' : ''}`}
          disabled={processing || isLoading || !!holderInfo?.name}
          readOnly={!!holderInfo?.name}
          placeholder="Como aparece no cartão"
        />
      </div>

      {/* Número do Cartão */}
      <div>
        <label htmlFor="number" className="block text-sm font-medium mb-1">
          Número do Cartão
        </label>
        <input
          id="number"
          type="text"
          value={cardData.number}
          onChange={handleCardNumberChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={processing || isLoading}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />
      </div>

      {/* Validade e CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiry" className="block text-sm font-medium mb-1">
            Validade (MM/AA)
          </label>
          <input
            id="expiry"
            type="text"
            value={cardData.expiry}
            onChange={handleExpiryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={processing || isLoading}
            placeholder="MM/AA"
            maxLength={5}
          />
        </div>

        <div>
          <label htmlFor="ccv" className="block text-sm font-medium mb-1">
            CVV
          </label>
          <input
            id="ccv"
            type="text"
            value={cardData.ccv}
            onChange={handleCVVChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={processing || isLoading}
            placeholder="000"
            maxLength={4}
          />
        </div>
      </div>

      {/* Aviso de segurança */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-xs">
        🔒 Seus dados de cartão são processados com segurança em conformidade com LGPD
      </div>

      <button
        type="submit"
        disabled={processing || isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {processing ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
