"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Tag, AlertCircle, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AsaasCheckout from "@/components/AsaasCheckout";

export default function AceleradorDeResultadosPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cargo, setCargo] = useState("");
  const [colaboradores, setColaboradores] = useState("");
  const [faturamento, setFaturamento] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAsaasCheckout, setShowAsaasCheckout] = useState(false);
  
  // Configuracoes carregadas do servidor (definidas pelo admin)
  const [customPrice, setCustomPrice] = useState(949.00);
  const [paymentDescription, setPaymentDescription] = useState("Acelerador de Resultados");
  const [configLoading, setConfigLoading] = useState(true);

  // Carregar configuracoes do servidor (API)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/checkout-config-acelerador");
        const data = await response.json();
        if (data.success && data.config) {
          setCustomPrice(data.config.price);
          setPaymentDescription(data.config.description);
        }
      } catch (error) {
        console.error("Erro ao carregar configuracoes:", error);
      } finally {
        setConfigLoading(false);
      }
    };
    
    fetchConfig();
    
    // Atualizar a cada 30 segundos para pegar mudancas do admin
    const interval = setInterval(fetchConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  const coursePrice = customPrice;
  const finalPrice = appliedCoupon
    ? coursePrice * (1 - appliedCoupon.discount / 100)
    : coursePrice;

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
    company: touched.company && !company.trim() ? "Empresa é obrigatória" : "",
    cpfCnpj: touched.cpfCnpj && !cpfCnpj.trim() ? "CPF/CNPJ é obrigatório" : "",
    cargo: touched.cargo && !cargo ? "Cargo é obrigatório" : "",
    colaboradores: touched.colaboradores && !colaboradores ? "Quantidade de colaboradores é obrigatória" : "",
    faturamento: touched.faturamento && !faturamento ? "Faturamento é obrigatório" : "",
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setError("Por favor, insira um código de cupom");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/validate-coupon-acelerador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          email: email || undefined, // Verificar se já usou, se email preenchido
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao validar cupom");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.code,
          discount: data.discount,
        });
        setError("");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    // Se o valor for 0, redireciona para página de agradecimento
    if (finalPrice === 0) {
      // Enviar dados para o webhook do n8n via API route (evita CORS)
      try {
        const webhookData = {
          name,
          phone,
          email,
          company,
          cpfCnpj,
          cargo, // Enviando novo dado
          colaboradores, // Enviando novo dado
          faturamento, // Enviando novo dado
          couponCode: appliedCoupon?.code || "",
          finalPrice,
          description: paymentDescription,
          event: "acelerador-de-resultados",
          timestamp: new Date().toISOString(),
        };
        
        const response = await fetch("/api/send-webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookData),
        });

        if (!response.ok) {
          console.error("[v0] Error sending webhook:", await response.text());
        }
      } catch (error) {
        console.error("[v0] Error sending to webhook:", error);
      }

      // Se usou cupom, registrar o uso do cupom
      if (appliedCoupon) {
        try {
          const registerResponse = await fetch("/api/register-coupon-use", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: appliedCoupon.code,
              name,
              phone,
              email,
              company,
              cpfCnpj,
              cargo, // Enviando novo dado
              colaboradores, // Enviando novo dado
              faturamento, // Enviando novo dado
              event: "acelerador-de-resultados",
            }),
          });

          if (!registerResponse.ok) {
            console.error("[v0] Error registering coupon use:", await registerResponse.text());
          }
        } catch (error) {
          console.error("[v0] Error registering coupon use:", error);
        }
      }
      // NOTA: Cadastros sem cupom serao registrados apenas quando o pagamento for confirmado via webhook

      sessionStorage.setItem("registration_confirmed", "true");
      router.push("/obrigado");
      return;
    }

    // Se houver valor, salvar checkout pendente e ir para checkout ASAAS
    try {
      const pendingResponse = await fetch("/api/pending-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          company,
          cpfCnpj,
          cargo, // Enviando novo dado
          colaboradores, // Enviando novo dado
          faturamento, // Enviando novo dado
          event: "acelerador-de-resultados",
          finalPrice,
          description: paymentDescription,
        }),
      });

      if (!pendingResponse.ok) {
        console.error("[v0] Error saving pending checkout:", await pendingResponse.text());
      }
    } catch (error) {
      console.error("[v0] Error saving pending checkout:", error);
    }

    // Armazenar dados no sessionStorage para o checkout ASAAS
    sessionStorage.setItem("checkout_data", JSON.stringify({
      name,
      phone,
      email,
      company,
      cpfCnpj,
      cargo, // Enviando novo dado
      colaboradores, // Enviando novo dado
      faturamento, // Enviando novo dado
      couponCode: appliedCoupon?.code || "",
      finalPrice,
      description: paymentDescription,
      event: "acelerador-de-resultados",
      timestamp: new Date().toISOString(),
    }));

    setShowAsaasCheckout(true);
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
              Finalize seu pagamento - Acelerador de Resultados
            </p>
          </div>

          <div className="bg-white rounded-lg p-8">
            <AsaasCheckout amount={finalPrice} description={paymentDescription} />
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
            Imersão Acelerador de Resultados
          </h1>
          <p className="text-white max-w-3xl mx-auto">
            Edição exclusiva com a presença de Ernesto Haberkorn e Brena Novelli, reunindo empresários que querem estruturar liderança, vendas, cultura e indicadores com método.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Course Info Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <img
                    src="/course-image.jpg"
                    alt="Imersão Acelerador de Resultados"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      Imersão Acelerador de Resultados
                    </h2>
                    <p className="text-slate-600 text-sm mb-3">
                      3 dias de imersão com Ernesto Haberkorn e Brena Novelli para estruturar liderança, vendas, cultura e indicadores.
                    </p>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      1 Entrada Inteira
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Informações de Contato</h3>
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
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                      Empresa <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Nome da sua empresa ou Empresa que você é colaborador"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      onBlur={() => handleBlur("company")}
                      className={`w-full ${fieldErrors.company ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    />
                    {fieldErrors.company && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.company}</p>
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

                  {/* CARGO */}
                  <div>
                    <label htmlFor="cargo" className="block text-sm font-medium text-slate-700 mb-2">
                      Cargo <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="cargo"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      onBlur={() => handleBlur("cargo")}
                      className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${fieldErrors.cargo ? "border-red-400 focus:ring-red-400" : ""} ${!cargo ? "text-slate-500" : "text-slate-900"}`}
                    >
                      <option value="" disabled hidden>Selecione seu cargo</option>
                      <option value="CEO">CEO</option>
                      <option value="Diretor">Diretor</option>
                      <option value="Gestor">Gestor</option>
                      <option value="Colaborador">Colaborador</option>
                    </select>
                    {fieldErrors.cargo && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.cargo}</p>
                    )}
                  </div>

                  {/* QUANTIDADE DE COLABORADORES */}
                  <div>
                    <label htmlFor="colaboradores" className="block text-sm font-medium text-slate-700 mb-2">
                      Quantidade de Colaboradores <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="colaboradores"
                      value={colaboradores}
                      onChange={(e) => setColaboradores(e.target.value)}
                      onBlur={() => handleBlur("colaboradores")}
                      className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${fieldErrors.colaboradores ? "border-red-400 focus:ring-red-400" : ""} ${!colaboradores ? "text-slate-500" : "text-slate-900"}`}
                    >
                      <option value="" disabled hidden>Selecione a quantidade</option>
                      <option value="1 a 20">1 a 20</option>
                      <option value="20 a 50">20 a 50</option>
                      <option value="50 a 100">50 a 100</option>
                      <option value="100 a 200">100 a 200</option>
                      <option value="200 +">200 +</option>
                    </select>
                    {fieldErrors.colaboradores && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.colaboradores}</p>
                    )}
                  </div>

                  {/* FATURAMENTO MÊS */}
                  <div>
                    <label htmlFor="faturamento" className="block text-sm font-medium text-slate-700 mb-2">
                      Faturamento Mensal <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="faturamento"
                      value={faturamento}
                      onChange={(e) => setFaturamento(e.target.value)}
                      onBlur={() => handleBlur("faturamento")}
                      className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${fieldErrors.faturamento ? "border-red-400 focus:ring-red-400" : ""} ${!faturamento ? "text-slate-500" : "text-slate-900"}`}
                    >
                      <option value="" disabled hidden>Selecione o faturamento</option>
                      <option value="50.000 a 100.000">50.000 a 100.000</option>
                      <option value="100.000 a 500.000">100.000 a 500.000</option>
                      <option value="500.000 a 1.000.000.00">500.000 a 1.000.000</option>
                      <option value="1.000.000.00 +">1.000.000 +</option>
                    </select>
                    {fieldErrors.faturamento && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.faturamento}</p>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Coupon Section */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Cupom de Desconto</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código do cupom"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setError("");
                      }}
                      disabled={!!appliedCoupon}
                      className="flex-1 uppercase"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={loading || !!appliedCoupon}
                      className="bg-[#D4AF37] hover:bg-[#D4AF37]/50 text-[#121242] cursor-pointer"
                    >
                      {loading ? "Validando..." : "Aplicar"}
                    </Button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="text-sm text-emerald-700">
                        Cupom <strong>{appliedCoupon.code}</strong> aplicado com sucesso! {appliedCoupon.discount}% de desconto
                      </p>
                    </div>
                  )}
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
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">15, 16 e 17 de Abril de 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-900 uppercase font-bold">Ingresso</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">1 Entrada Inteira</span>
                    <span className="text-slate-900 font-medium">R$ {coursePrice.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="text-emerald-600 font-medium">Desconto ({appliedCoupon.discount}%)</span>
                      <span className="text-emerald-600 font-medium">
                        -R$ {((coursePrice * appliedCoupon.discount) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-slate-900">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {finalPrice === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 text-center">
                      Clique no botão, para criar o usuário no MemberKit e receba o login e senha no seu e-mail!
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleProceedToPayment}
                  disabled={!name.trim() || !phone.trim() || !email.trim() || !isValidEmail(email) || !company.trim() || !cpfCnpj || !cargo || !colaboradores || !faturamento}
                  className="w-full bg-[#D4AF37] hover:bg-[#121242]/70 text-[#121242] hover:text-white font-medium py-6 cursor-pointer"
                >
                  {finalPrice === 0 ? "Confirmar Inscrição" : "Ir para Pagamento"}
                  {finalPrice > 0 && <ExternalLink className="w-4 h-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}