import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log("[v0] Sending data to n8n webhook:", data);

    // Fazer a requisição para o webhook do n8n FIT Gestão
    const webhookUrl = "https://io.fitgestao.com/webhook/915eb74d-0bd2-438e-82a7-7ea9c87a57ad";
    
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
    });
  } catch (error) {
    console.error("[v0] Error sending to webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
