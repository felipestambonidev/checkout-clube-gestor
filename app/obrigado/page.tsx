"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121242] via-[#1a1a5e] to-[#121242]">
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

      {/* Thank You Content */}
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-slate-700 mb-2">
                <strong>Próximos passos:</strong>
              </p>
              <p className="text-slate-600">
                Em breve você receberá um e-mail com suas credenciais de acesso
                ao <strong>MemberKit</strong>. Verifique sua caixa de entrada e
                também a pasta de spam.
              </p>
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
