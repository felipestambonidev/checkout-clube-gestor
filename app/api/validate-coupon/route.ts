import { NextResponse } from "next/server";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

export async function POST(request: Request) {
  try {
    const { code, email } = await request.json();

    if (!code || !email) {
      return NextResponse.json(
        { error: "Código do cupom e email são obrigatórios" },
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

    // Verificar se o cupom já foi usado
    if (Item.isUsed) {
      return NextResponse.json(
        { error: "Este cupom já foi utilizado" },
        { status: 400 }
      );
    }

    // Marcar cupom como usado
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `COUPON#${code.toUpperCase()}`,
      },
      UpdateExpression: "SET isUsed = :used, usedBy = :email, usedAt = :date",
      ExpressionAttributeValues: {
        ":used": true,
        ":email": email,
        ":date": new Date().toISOString(),
      },
    });

    await docClient.send(updateCommand);

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
