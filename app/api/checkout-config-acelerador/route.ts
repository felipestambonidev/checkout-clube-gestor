import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

const CONFIG_KEY = "CONFIG#CHECKOUT_ACELERADOR";

interface CheckoutConfig {
  price: number;
  description: string;
  updatedAt: string;
}

// Funcao para verificar se o admin esta autenticado
async function isAdminAuthenticated(): Promise<boolean> {
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

// GET - Buscar configuração atual
export async function GET() {
  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: CONFIG_KEY,
      },
    });

    const result = await docClient.send(getCommand);

    if (result.Item) {
      return NextResponse.json({
        success: true,
        config: {
          price: result.Item.price,
          description: result.Item.description,
          updatedAt: result.Item.updatedAt,
        },
      });
    }

    // Retornar valores padrão se não existir configuração
    return NextResponse.json({
      success: true,
      config: {
        price: 949.00,
        description: "Acelerador de Resultados",
        updatedAt: null,
      },
    });
  } catch (error) {
    console.error("[v0] Error fetching checkout config acelerador:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

// POST - Salvar configuração
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via cookie de sessão
    const isAuthenticated = await isAdminAuthenticated();
    
    if (!isAuthenticated) {
      console.warn("[Checkout Config Acelerador] Tentativa de acesso nao autorizado");
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { price, description } = await request.json();

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { error: "Preço inválido" },
        { status: 400 }
      );
    }

    const config: CheckoutConfig = {
      price,
      description: description || "Acelerador de Resultados",
      updatedAt: new Date().toISOString(),
    };

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        [PARTITION_KEY]: CONFIG_KEY,
        ...config,
      },
    });

    await docClient.send(putCommand);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("[v0] Error saving checkout config acelerador:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}
