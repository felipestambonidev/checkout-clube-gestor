import { NextResponse } from "next/server";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

// Criar novo cupom
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
        [PARTITION_KEY]: `COUPON#${code.toUpperCase()}`,
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
    console.error("[v0] Error creating coupon:", error);
    return NextResponse.json(
      { error: "Erro ao criar cupom" },
      { status: 500 }
    );
  }
}

// Listar todos os cupons
export async function GET() {
  try {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const { Items } = await docClient.send(scanCommand);

    // Filtrar apenas cupons (não outros tipos de dados)
    const coupons = (Items || [])
      .filter((item) => item[PARTITION_KEY]?.startsWith("COUPON#"))
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
    console.error("[v0] Error listing coupons:", error);
    return NextResponse.json(
      { error: "Erro ao listar cupons" },
      { status: 500 }
    );
  }
}
