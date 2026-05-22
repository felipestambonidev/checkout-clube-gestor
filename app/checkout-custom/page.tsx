"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, CreditCard, Settings } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import AsaasCheckout from "@/components/AsaasCheckout";

export default function CheckoutCustomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pegar valores da URL ou usar defaults
  const urlAmount = searchParams.get('amount');
  const urlDescription = searchParams.get('description');
  const urlProductName = searchParams.get('productName');
  
  // Estados do formulário de cliente
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Estados de configuração do pagamento
  const [customAmount, setCustomAmount] = useState(urlAmount || "100.00");
  const [description, setDescription] = useState(urlDescription || "");
  const [productName, setProductName] = useState(urlProductName || "Produto Clube Gestor");
  const [showAsaasCheckout, setShowAsaasCheckout] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(!urlAmount && !urlDescription);

  // Pegar valores configurados
  const finalAmount = parseFloat(customAmount) || 0;

  // --- FUNÇÕES DE MÁSCARA ---
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const maskCpfCnpj = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    if (rawValue.length <= 11) {
      return rawValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return rawValue
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value.trim().toLowerCase());
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const fieldErrors = {
    name: touched.name && !name.trim() ? "Nome Completo é obrigatório" : "",
    phone: touched.phone && !phone.trim() ? "Telefone é obrigatório" : "",
    email: touched.email
      ? !email.trim()
        ? "Email é obrigatório"
        : !isValidEmail(email)
          ? "Email inválido"
          : ""
      : "",
    cpfCnpj: touched.cpfCnpj && !cpfCnpj.trim() ? "CPF/CNPJ é obrigatório" : "",
  };

  const handleProceedToPayment = () => {
    // Armazena dados no sessionStorage para o checkout
    sessionStorage.setItem("checkout_data", JSON.stringify({
      name,
      phone,
      email,
      cpfCnpj,
      finalPrice: finalAmount,
      description,
      productName,
      timestamp: new Date().toISOString(),
    }));

    setShowAsaasCheckout(true);
  };

  const generateCheckoutUrl = () => {
    const params = new URLSearchParams();
    params.set('amount', customAmount);
    params.set('description', description);
    params.set('productName', productName);
    return `${window.location.origin}/checkout-custom?${params.toString()}`;
  };

  const copyCheckoutUrl = () => {
    const url = generateCheckoutUrl();
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
  };

  // Se mostrar checkout ASAAS, renderizar apenas o formulário de pagamento
  if (showAsaasCheckout) {
    return (
      <div className="min-h-screen bg-[#121242]">
        <div className="flex flex-col items-center text-center pt-10">
          <Image
            src="/logo-clube-gestor.png"
            alt="Clube Gestor"
            width={280}
            height={130}
            className="h-12 md:h-20 w-auto"
            priority
          />
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">
              Pagamento Seguro
            </h1>
            <p className="text-white">
              {productName}
            </p>
          </div>

          <div className="bg-white rounded-lg p-8">
            <AsaasCheckout 
              amount={finalAmount} 
              description={description || `${productName} - Clube Gestor`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121242]">
      <div className="flex flex-col items-center text-center pt-10">
        <Image
          src="/logo-clube-gestor.png"
          alt="Clube Gestor"
          width={280}
          height={130}
          className="h-12 md:h-20 w-auto"
          priority
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">
            {isConfigMode ? "Configurar Checkout Personalizado" : "Checkout de Pagamento"}
          </h1>
          <p className="text-white">
            {isConfigMode ? "Configure o valor e a descrição para o Memberkit/n8n" : productName}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Config Mode - Configuração do Pagamento */}
            {isConfigMode && (
              <Card className="border-[#C0992E] bg-[#C0992E]/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Settings className="w-5 h-5 text-[#C0992E]" />
                    Configurações do Checkout (Admin)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Nome do Produto
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Mentoria Individual"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Valor (R$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Descrição do Pagamento (para Memberkit/n8n)
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: 357603 Turma"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white"
                    />
                    <p className="text-xs text-[#C0992E] mt-1">
                      Formato: ID + Tipo (ex: &quot;357603 Turma&quot; ou &quot;123456 Assinatura&quot;)
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#C0992E]/30">
                    <Button
                      onClick={copyCheckoutUrl}
                      disabled={!customAmount || !description}
                      className="w-full bg-[#C0992E] hover:bg-[#C0992E]/80 text-[#121242] font-medium"
                    >
                      Copiar Link do Checkout
                    </Button>
                    <p className="text-xs text-white/70 mt-2 text-center">
                      Copie o link para enviar ao cliente ou use o formulário abaixo para testar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Info Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg bg-[#C0992E]/20 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-[#C0992E]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      {productName}
                    </h2>
                    {description && (
                      <p className="text-slate-600 text-sm mb-3">
                        Ref: {description}
                      </p>
                    )}
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Pagamento via ASAAS
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Informações do Cliente</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => handleBlur("name")}
                      className={`w-full ${fieldErrors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      Telefone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      onBlur={() => handleBlur("phone")}
                      maxLength={15}
                      className={`w-full ${fieldErrors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={`w-full ${fieldErrors.email ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="cpfCnpj" className="block text-sm font-medium text-slate-700 mb-2">
                      CPF ou CNPJ <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="cpfCnpj"
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                      onBlur={() => handleBlur("cpfCnpj")}
                      maxLength={18}
                      className={`w-full ${fieldErrors.cpfCnpj ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    />
                    {fieldErrors.cpfCnpj && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.cpfCnpj}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 shadow-sm sticky top-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumo do Pedido</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-900 uppercase font-bold">Produto</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{productName}</span>
                    <span className="text-slate-900 font-medium">R$ {finalAmount.toFixed(2)}</span>
                  </div>
                  
                  {description && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        Referência: {description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-slate-900">R$ {finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToPayment}
                  disabled={!name.trim() || !phone.trim() || !email.trim() || !isValidEmail(email) || !cpfCnpj.trim() || finalAmount <= 0}
                  className="w-full bg-[#D4AF37] hover:bg-[#121242]/70 text-[#121242] hover:text-white font-medium py-6 cursor-pointer"
                >
                  Ir para Pagamento
                </Button>

                {(!description && isConfigMode) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-700">
                        Preencha a descrição acima para integrar com o Memberkit/n8n
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
