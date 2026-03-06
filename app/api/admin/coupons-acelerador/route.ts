import { NextResponse } from "next/server";
import { PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

// Criar novo cupom para Acelerador de Resultados
export async function POST(request: Request) {
  try {
    const { code, discount, maxUses } = await request.json();

    if (!code || !discount || !maxUses) {
      return NextResponse.json(
        { error: "Código, desconto e quantidade máxima são obrigatórios" },
        { status: 400 }
      );
    }

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        [PARTITION_KEY]: `ACELERADOR#${code.toUpperCase()}`,
        code: code.toUpperCase(),
        discount: Number(discount),
        maxUses: Number(maxUses),
        usedBy: [],
        createdAt: new Date().toISOString(),
      },
    });

    await docClient.send(putCommand);

    return NextResponse.json({
      success: true,
      message: "Cupom criado com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error creating acelerador coupon:", error);
    return NextResponse.json(
      { error: "Erro ao criar cupom" },
      { status: 500 }
    );
  }
}

// Listar todos os cupons do Acelerador de Resultados
export async function GET() {
  try {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const { Items } = await docClient.send(scanCommand);

    // Filtrar apenas cupons do Acelerador (prefixo ACELERADOR#)
    const coupons = (Items || [])
      .filter((item) => item[PARTITION_KEY]?.startsWith("ACELERADOR#"))
      .map((item) => ({
        code: item.code,
        discount: item.discount,
        maxUses: item.maxUses || 1,
        usedCount: item.usedBy ? item.usedBy.length : 0,
        usedBy: item.usedBy || [],
        createdAt: item.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("[v0] Error listing acelerador coupons:", error);
    return NextResponse.json(
      { error: "Erro ao listar cupons" },
      { status: 500 }
    );
  }
}

// Excluir cupom do Acelerador
export async function DELETE(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Código do cupom é obrigatório" },
        { status: 400 }
      );
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `ACELERADOR#${code.toUpperCase()}`,
      },
    });

    await docClient.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: "Cupom excluído com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error deleting acelerador coupon:", error);
    return NextResponse.json(
      { error: "Erro ao excluir cupom" },
      { status: 500 }
    );
  }
}
