import { NextResponse } from "next/server";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

export async function POST(request: Request) {
  try {
    const { code, name, phone, email, company, cpfCnpj, event } = await request.json();

    if (!code || !name || !phone || !email || !company || !cpfCnpj) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Determinar o prefixo baseado no evento
    const prefix = event === "acelerador-de-resultados" ? "ACELERADOR#" : "COUPON#";

    // Buscar o cupom no DynamoDB
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `${prefix}${code.toUpperCase()}`,
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

    // Verificar se este email já usou o cupom
    const usedBy = Item.usedBy || [];
    const alreadyUsed = usedBy.some((user: any) => user.email === email);

    if (alreadyUsed) {
      return NextResponse.json(
        { error: "Você já utilizou este cupom" },
        { status: 400 }
      );
    }

    // Adicionar novo uso
    const newUser = {
      name,
      phone,
      email,
      company,
      cpfCnpj,
      usedAt: new Date().toISOString(),
    };

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `${prefix}${code.toUpperCase()}`,
      },
      UpdateExpression: "SET usedBy = list_append(if_not_exists(usedBy, :empty_list), :new_user)",
      ExpressionAttributeValues: {
        ":empty_list": [],
        ":new_user": [newUser],
      },
    });

    await docClient.send(updateCommand);

    return NextResponse.json({
      success: true,
      message: "Uso do cupom registrado com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error registering coupon use:", error);
    return NextResponse.json(
      { error: "Erro ao registrar uso do cupom" },
      { status: 500 }
    );
  }
}
