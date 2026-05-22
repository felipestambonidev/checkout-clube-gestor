import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log("[v0] Dados recebidos:", data);

    // Determinar qual webhook usar baseado se tem cupom ou não
    const hasCoupon = data.couponCode && data.couponCode.trim() !== "";
    
    // Webhook para CUPOM (pessoa usou cupom)
    const couponWebhookUrl = "https://io.fitgestao.com/webhook-test/bc8b3f2f-6ed1-4820-a9af-8caa62e89e65";
    
    // Webhook para PAGAMENTO (sem cupom)
    const paymentWebhookUrl = "https://io.fitgestao.com/webhook-test/a7f2d898-ed29-458d-93a9-effe55fbf50d";
    
    const webhookUrl = hasCoupon ? couponWebhookUrl : paymentWebhookUrl;
    
    console.log("[v0] Usando webhook:", hasCoupon ? "CUPOM" : "PAGAMENTO");
    console.log("[v0] URL:", webhookUrl);
    console.log("[v0] Description:", data.description);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("[v0] Webhook response status:", response.status);
    const responseText = await response.text();
    console.log("[v0] Webhook response:", responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao enviar dados para o webhook", details: responseText },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dados enviados com sucesso",
      webhookType: hasCoupon ? "coupon" : "payment",
    });
  } catch (error) {
    console.error("[v0] Error sending to webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
