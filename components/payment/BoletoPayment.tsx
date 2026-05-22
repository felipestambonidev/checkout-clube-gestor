'use client';

import { useState } from 'react';

interface BoletoPaymentProps {
  amount: number;
  onPaymentSuccess: (paymentId: string) => void;
  isLoading?: boolean;
  customerId: string;
}

export default function BoletoPayment({
  amount,
  onPaymentSuccess,
  isLoading = false,
  customerId,
}: BoletoPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [boletoData, setBoletoData] = useState({
    barcodeNumber: '',
    boletoUrl: '',
    paymentId: '',
  });
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateBoleto = async () => {
    setLoading(true);
    setError('');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      const response = await fetch('/api/asaas/charge-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          amount,
          description: 'Checkout Clube Gestor',
          dueDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao gerar boleto');
        return;
      }

      setBoletoData({
        barcodeNumber: result.barcodeNumber || '',
        boletoUrl: result.boletoUrl || '',
        paymentId: result.paymentId || '',
      });
    } catch (err) {
      setError('Erro ao conectar com servidor');
      console.error('[BoletoPayment] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyBarcode = () => {
    if (boletoData.barcodeNumber) {
      navigator.clipboard.writeText(boletoData.barcodeNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (boletoData.paymentId) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          ✓ Boleto gerado com sucesso!
        </div>

        {/* Código de Barras */}
        {boletoData.barcodeNumber && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Código de Barras</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={boletoData.barcodeNumber}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={copyBarcode}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {/* Link para download */}
        {boletoData.boletoUrl && (
          <a
            href={boletoData.boletoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 text-center"
          >
            📥 Baixar Boleto PDF
          </a>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm space-y-2">
          <p className="font-medium">Como pagar:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Copie o código de barras acima</li>
            <li>Entre no seu banco (app ou site)</li>
            <li>Selecione "Pagar" ou "Boleto"</li>
            <li>Cole o código de barras</li>
            <li>Confirme e realize o pagamento</li>
          </ol>
          <p className="text-xs mt-2">Verifique a data de vencimento antes de pagar</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBoletoData({
              barcodeNumber: '',
              boletoUrl: '',
              paymentId: '',
            });
          }}
          className="w-full bg-gray-300 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-400"
        >
          Gerar novo Boleto
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
        Clique no botão abaixo para gerar um boleto e realizar o pagamento
      </p>

      <button
        onClick={generateBoleto}
        disabled={loading || isLoading}
        className="w-full bg-orange-600 text-white py-3 rounded-md font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
      >
        {loading ? 'Gerando Boleto...' : `Gerar Boleto - R$ ${amount.toFixed(2)}`}
      </button>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-xs">
        🔒 Seus dados estão protegidos em conformidade com LGPD
      </div>
    </div>
  );
}
