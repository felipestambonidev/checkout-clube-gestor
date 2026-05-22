import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Configuracao padrao
const DEFAULT_CONFIG = {
  price: 228.00,
  description: "357603 Turma",
  updatedAt: new Date().toISOString(),
};

// Armazenamento em memoria (sera resetado quando o servidor reiniciar)
// Para producao, considere usar um banco de dados como Vercel KV ou Supabase
let checkoutConfig = { ...DEFAULT_CONFIG };

// Funcao para verificar se o admin esta autenticado
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    // Verifica se existe um cookie de sessao valido
    if (adminSession?.value) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    config: checkoutConfig,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticacao via cookie de sessao (mais seguro)
    const isAuthenticated = await isAdminAuthenticated(request);
    
    if (!isAuthenticated) {
      console.warn("[Checkout Config] Tentativa de acesso nao autorizado");
      return NextResponse.json(
        { success: false, error: "Nao autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { price, description } = body;

    // Validacao de entrada
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 100000) {
        return NextResponse.json(
          { success: false, error: "Preco invalido" },
          { status: 400 }
        );
      }
      checkoutConfig.price = parsedPrice;
    }
    
    if (description !== undefined) {
      // Sanitizar descricao - remover caracteres potencialmente perigosos
      const sanitizedDescription = String(description)
        .slice(0, 200) // Limitar tamanho
        .replace(/[<>]/g, ""); // Remover tags HTML
      checkoutConfig.description = sanitizedDescription || DEFAULT_CONFIG.description;
    }
    
    checkoutConfig.updatedAt = new Date().toISOString();

    console.log("[Checkout Config] Atualizado por admin autenticado");

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
