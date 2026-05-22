import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Configuracao padrao
const DEFAULT_CONFIG = {
  price: 228.00,
  description: "357603 Turma",
  updatedAt: new Date().toISOString(),
};

// Armazenamento em memoria (sera resetado quando o servidor reiniciar)
// Para producao, considere usar um banco de dados
let checkoutConfig = { ...DEFAULT_CONFIG };

export async function GET() {
  return NextResponse.json({
    success: true,
    config: checkoutConfig,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuario esta autenticado como admin
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("admin_authenticated");
    
    // Tambem aceita se vier do sessionStorage via header
    const authHeader = request.headers.get("x-admin-auth");
    
    if (!adminAuth?.value && authHeader !== "true") {
      return NextResponse.json(
        { success: false, error: "Nao autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { price, description } = body;

    if (price !== undefined) {
      checkoutConfig.price = parseFloat(price) || DEFAULT_CONFIG.price;
    }
    
    if (description !== undefined) {
      checkoutConfig.description = description || DEFAULT_CONFIG.description;
    }
    
    checkoutConfig.updatedAt = new Date().toISOString();

    console.log("[Checkout Config] Atualizado:", checkoutConfig);

    return NextResponse.json({
      success: true,
      config: checkoutConfig,
    });
  } catch (error) {
    console.error("[Checkout Config] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar configuracao" },
      { status: 500 }
    );
  }
}
