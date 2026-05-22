'use client';

import { useState } from 'react';
import Image from 'next/image';

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

interface PixPaymentProps {
  amount: number;
  onPaymentSuccess: (paymentId: string) => void;
  isLoading?: boolean;
  customerId?: string;
  holderInfo?: HolderInfo;
}

export default function PixPayment({
  amount,
  onPaymentSuccess,
  isLoading = false,
  customerId,
  holderInfo,
}: PixPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePix = async () => {
    setLoading(true);
    setError('');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      const response = await fetch('/api/asaas/charge-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          holderInfo: holderInfo || undefined,
          amount,
          description: 'Checkout Clube Gestor',
          dueDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao gerar PIX');
        return;
      }

      setPaymentId(result.paymentId);
      setPixKey(result.pixKey || '');
      setQrCode(result.qrCodeUrl || '');

      // Iniciar polling para verificar pagamento
      startPaymentPolling(result.paymentId);
    } catch (err) {
      setError('Erro ao conectar com servidor');
      console.error('[PixPayment] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (pId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/asaas/check-payment?paymentId=${pId}`);
        const result = await response.json();

        if (result.status === 'RECEIVED' || result.status === 'CONFIRMED') {
          clearInterval(interval);
          onPaymentSuccess(pId);
        }
      } catch (err) {
        console.error('[PixPayment] Erro ao verificar pagamento:', err);
      }
    }, 3000); // Verificar a cada 3 segundos

    // Limpar intervalo após 10 minutos
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  const copyPixKey = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (paymentId && qrCode) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          ✓ QR Code gerado com sucesso!
        </div>

        {/* QR Code */}
        <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
          {qrCode && (
            <Image
              src={qrCode}
              alt="QR Code PIX"
              width={200}
              height={200}
              className="border border-gray-300"
            />
          )}
        </div>

        {/* Chave PIX */}
        {pixKey && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Chave PIX (Copia e Cola)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pixKey}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                type="button"
                onClick={copyPixKey}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm space-y-2">
          <p className="font-medium">Como pagar:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Abra o app do seu banco</li>
            <li>Escaneie o QR Code com a câmera ou seu app</li>
            <li>Confirme os dados da transação</li>
            <li>Aprove a transação</li>
          </ol>
          <p className="text-xs mt-2">Seu pagamento será detectado automaticamente em poucos segundos</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPaymentId('');
            setQrCode('');
            setPixKey('');
          }}
          className="w-full bg-gray-300 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-400"
        >
          Gerar novo PIX
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Clique no botão abaixo para gerar um QR Code PIX e realizar o pagamento
      </p>

      <button
        onClick={generatePix}
        disabled={loading || isLoading}
        className="w-full bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
      >
        {loading ? 'Gerando QR Code...' : `Gerar QR Code PIX - R$ ${amount.toFixed(2)}`}
      </button>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-xs">
        🔒 Seus dados estão protegidos em conformidade com LGPD
      </div>
    </div>
  );
}
