import { Suspense } from "react";
import { CheckoutCustomClient } from "./client";

export const metadata = {
  title: "Checkout Personalizado | Clube Gestor",
  description: "Configure seu checkout personalizado com valor e descrição customizados para integração com o n8n e Memberkit.",
};

function CheckoutLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#121242] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
        <p className="text-white mt-4">Carregando...</p>
      </div>
    </div>
  );
}

export default function CheckoutCustomPage() {
  return (
    <Suspense fallback={<CheckoutLoadingFallback />}>
      <CheckoutCustomClient />
    </Suspense>
  );
}
