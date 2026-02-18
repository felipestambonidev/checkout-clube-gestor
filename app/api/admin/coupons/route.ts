import { NextResponse } from "next/server";
import { PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
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

// Auto-seed default coupons if table is empty
async function seedDefaultCoupons() {
  const defaultCoupons = [
    {
      code: "DESCONTO100",
      discount: 100,
      maxUses: 100,
      description: "Desconto de 100% - Entrada gratuita",
    },
    {
      code: "PROMO100",
      discount: 100,
      maxUses: 100,
      description: "Promocao especial - 100% off",
    },
    {
      code: "BEMVINDO",
      discount: 100,
      maxUses: 100,
      description: "Cupom de boas-vindas - 100% off",
    },
  ];

  for (const coupon of defaultCoupons) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          [PARTITION_KEY]: `COUPON#${coupon.code}`,
          code: coupon.code,
          discount: coupon.discount,
          maxUses: coupon.maxUses,
          description: coupon.description,
          usedBy: [],
          createdAt: new Date().toISOString(),
        },
      })
    );
  }

  console.log("[v0] Auto-seeded default coupons:", defaultCoupons.map((c) => c.code));
}

// Listar todos os cupons
export async function GET() {
  try {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const { Items } = await docClient.send(scanCommand);

    // Filtrar apenas cupons (não outros tipos de dados)
    let coupons = (Items || [])
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

    // If no coupons exist, auto-seed and re-fetch
    if (coupons.length === 0) {
      console.log("[v0] No coupons found, auto-seeding defaults...");
      await seedDefaultCoupons();

      const reScan = await docClient.send(
        new ScanCommand({ TableName: TABLE_NAME })
      );

      coupons = (reScan.Items || [])
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
    }

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("[v0] Error listing coupons:", error);
    return NextResponse.json(
      { error: "Erro ao listar cupons" },
      { status: 500 }
    );
  }
}

// Excluir cupom
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
        [PARTITION_KEY]: `COUPON#${code.toUpperCase()}`,
      },
    });

    await docClient.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: "Cupom excluído com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Erro ao excluir cupom" },
      { status: 500 }
    );
  }
}
