import { NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

export async function POST(request: Request) {
  try {
    const { code, email } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Código do cupom é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o cupom no DynamoDB
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `COUPON#${code.toUpperCase()}`,
      },
    });

    const { Item } = await docClient.send(getCommand);

    if (!Item) {
      return NextResponse.json(
        { error: "Cupom inválido" },
        { status: 404 }
      );
    }

    // Verificar limite de usos
    const usedCount = Item.usedBy ? Item.usedBy.length : 0;
    const maxUses = Item.maxUses || 1;

    if (usedCount >= maxUses) {
      return NextResponse.json(
        { error: "Este cupom atingiu o limite de usos" },
        { status: 400 }
      );
    }

    // Verificar se este email já usou o cupom (se email fornecido)
    if (email) {
      const usedBy = Item.usedBy || [];
      const alreadyUsed = usedBy.some((user: any) => user.email === email);

      if (alreadyUsed) {
        return NextResponse.json(
          { error: "Você já utilizou este cupom" },
          { status: 400 }
        );
      }
    }

    // Apenas validar - NÃO salva o uso ainda
    return NextResponse.json({
      success: true,
      discount: Item.discount,
      code: Item.code,
    });
  } catch (error) {
    console.error("[v0] Error validating coupon:", error);
    return NextResponse.json(
      { error: "Erro ao validar cupom" },
      { status: 500 }
    );
  }
}
