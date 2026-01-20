"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Tag, AlertCircle, ExternalLink } from "lucide-react";
import LogoClube from "../public/logo-clube-gestor.png";
import Image from "next/image";

export default function CheckoutPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const coursePrice = 474.90;
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

  const handleApplyCoupon = async () => {
    if (!name || !phone || !email || !cpfCnpj) {
      setError("Por favor, preencha todos os campos de contato primeiro");
      return;
    }

    if (!couponCode) {
      setError("Por favor, insira um código de cupom");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          name,
          phone,
          email,
          cpfCnpj,
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

  const handleProceedToPayment = () => {
    const paymentLink = "https://www.asaas.com/c/odfjkhnshezee7wc";
    window.open(paymentLink, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#121242]">
      <div className="flex flex-col items-center text-center pt-10">
        <Image
          src={LogoClube}
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
            Checkout de Pagamentos - Clube Gestor
          </h1>
          <p className="text-white">
            Complete sua inscrição no Workshop de Aceleração de Resultados | Jornada de Compra do Cliente
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* NOVO/RESTALRADO: Course Info Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <img
                    src="/course-image.jpg"
                    alt="Workshop de Aceleração de Resultados"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      Workshop de Aceleração de Resultados | Jornada de Compra do Cliente
                    </h2>
                    <p className="text-slate-600 text-sm mb-3">
                      Curso completo com carga horária de 3 horas, ministrado por especialistas do Clube Gestor.
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
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Nome Completo</label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      maxLength={15}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="cpfCnpj" className="block text-sm font-medium text-slate-700 mb-2">CPF ou CNPJ</label>
                    <Input
                      id="cpfCnpj"
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                      maxLength={18}
                      className="w-full"
                    />
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
                    <span className="text-slate-600">Quarta-Feira, 04 de Fevereiro · 09:00 às 12:00</span>
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

                <Button
                  onClick={handleProceedToPayment}
                  disabled={!name || !phone || !email || !cpfCnpj}
                  className="w-full bg-[#D4AF37] hover:bg-[#121242]/70 text-[#121242] hover:text-white font-medium py-6 cursor-pointer"
                >
                  {finalPrice === 0 ? "Confirmar Inscrição" : "Ir para Pagamento"}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}