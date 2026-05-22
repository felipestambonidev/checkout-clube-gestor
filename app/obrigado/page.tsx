"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    const sendCheckoutData = async () => {
      if (sent) return;

      try {
        // Buscar dados do checkout do sessionStorage
        const checkoutDataStr = sessionStorage.getItem("checkout_data");
        const isConfirmed = sessionStorage.getItem("registration_confirmed");

        if (!isConfirmed && !checkoutDataStr && !paymentId) {
          router.push("/");
          return;
        }

        if (checkoutDataStr) {
          const checkoutData = JSON.parse(checkoutDataStr);

          // Enviar dados para o webhook do n8n
          const webhookData = {
            ...checkoutData,
            paymentId: paymentId || null,
            source: "asaas_payment_success",
          };

          const response = await fetch("/api/send-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookData),
          });

          if (!response.ok) {
            console.error("[v0] Error sending webhook:", await response.text());
          }

          // Registrar o uso do cupom ou o checkout
          if (checkoutData.couponCode) {
            await fetch("/api/register-coupon-use", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: checkoutData.couponCode,
                name: checkoutData.name,
                phone: checkoutData.phone,
                email: checkoutData.email,
                company: checkoutData.company,
                cpfCnpj: checkoutData.cpfCnpj,
                event: "workshop",
                paymentId: paymentId || null,
              }),
            });
          } else {
            await fetch("/api/register-checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: checkoutData.name,
                phone: checkoutData.phone,
                email: checkoutData.email,
                company: checkoutData.company,
                cpfCnpj: checkoutData.cpfCnpj,
                event: "workshop",
                finalPrice: checkoutData.finalPrice,
                paymentId: paymentId || null,
              }),
            });
          }

          sessionStorage.removeItem("checkout_data");
        }

        if (isConfirmed) {
          sessionStorage.removeItem("registration_confirmed");
        }

        setSent(true);
      } catch (error) {
        console.error("[v0] Error sending data:", error);
      }
    };

    sendCheckoutData();
  }, [router, paymentId, sent]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#121242] via-[#1a1a5e] to-[#121242]">
      {/* Logo */}
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

    
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-slate-200 shadow-2xl">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Inscrição Confirmada!
            </h1>

            <p className="text-lg text-slate-600 mb-6">
              Parabéns! Sua inscrição foi realizada com sucesso.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-slate-700 mb-2">
                <strong>Próximos passos:</strong>
              </p>
              <p className="text-slate-600">
                Em breve você receberá um e-mail com suas credenciais de acesso
                ao <strong>MemberKit</strong>. Verifique sua caixa de entrada e
                também a pasta de spam.
              </p>
            </div>

            {paymentId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-xs text-green-800">
                  <strong>ID do Pagamento:</strong> {paymentId}
                </p>
              </div>
            )}

            {/* Chamada para o WhatsApp */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
              <p className="text-slate-700 mb-4">
                <strong>Importante:</strong> Entre no nosso grupo VIP do WhatsApp para receber todos os avisos e informações exclusivas!
              </p>
              <Button
                onClick={() => window.open("https://chat.whatsapp.com/CNbZflFMltH8NrKAAOiKzD", "_blank")}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-6 text-base"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Entrar no Grupo do WhatsApp
              </Button>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-[#D4AF37] hover:bg-[#121242]/70 text-[#121242] hover:text-white font-medium py-6"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar para a Página Inicial
              </Button>

              <p className="text-sm text-slate-500">
                Dúvidas? Entre em contato conosco pelo e-mail{" "}
                <a
                  href="mailto:contato@clubegestor.com"
                  className="text-[#D4AF37] hover:underline"
                >
                  contato@clubegestor.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
