import { NextResponse } from "next/server";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

const CONFIG_KEY = "CHECKOUT_CONFIG#default";

export interface CheckoutConfig {
  amount: number;
  description: string;
  productType: "Turma" | "Assinatura";
  productId: string;
  updatedAt: string;
}

// Buscar configuração atual
export async function GET() {
  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: CONFIG_KEY,
      },
    });

    const { Item } = await docClient.send(getCommand);

    if (!Item) {
      // Retornar configuração padrão
      return NextResponse.json({
        config: {
          amount: 228.0,
          description: "Checkout Clube Gestor",
          productType: "Turma",
          productId: "",
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      config: {
        amount: Item.amount,
        description: Item.description,
        productType: Item.productType,
        productId: Item.productId,
        updatedAt: Item.updatedAt,
      },
    });
  } catch (error) {
    console.error("[checkout-config] Erro ao buscar config:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

// Salvar configuração
export async function PUT(request: Request) {
  try {
    const { amount, productType, productId } = await request.json();

    if (!amount || !productType || !productId) {
      return NextResponse.json(
        { error: "Valor, tipo e ID do produto são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["Turma", "Assinatura"].includes(productType)) {
      return NextResponse.json(
        { error: "Tipo de produto deve ser Turma ou Assinatura" },
        { status: 400 }
      );
    }

    // Descrição no formato esperado pelo n8n: "357603 Turma" ou "357603 Assinatura"
    const description = `${productId} ${productType}`;

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        [PARTITION_KEY]: CONFIG_KEY,
        amount: Number(amount),
        description,
        productType,
        productId: String(productId),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(putCommand);

    return NextResponse.json({
      success: true,
      config: { amount: Number(amount), description, productType, productId: String(productId) },
    });
  } catch (error) {
    console.error("[checkout-config] Erro ao salvar config:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}
