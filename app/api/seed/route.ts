import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // First, check if there are already coupons in the table
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    const existingCoupons = (scanResult.Items || []).filter(
      (item: Record<string, any>) => {
        const pk = item[PARTITION_KEY];
        return typeof pk === "string" && pk.startsWith("COUPON#");
      }
    );

    if (existingCoupons.length > 0) {
      return NextResponse.json({
        message: `Table already has ${existingCoupons.length} coupons. Skipping seed.`,
        existingCoupons: existingCoupons.map((c: Record<string, any>) => c.code),
      });
    }

    // Default coupons from the previous database
    const coupons = [
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

    const results = [];

    for (const coupon of coupons) {
      const item = {
        [PARTITION_KEY]: `COUPON#${coupon.code}`,
        code: coupon.code,
        discount: coupon.discount,
        maxUses: coupon.maxUses,
        description: coupon.description,
        usedBy: [],
        createdAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );

      results.push(coupon.code);
    }

    return NextResponse.json({
      message: "Seeding complete!",
      createdCoupons: results,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed coupons" },
      { status: 500 }
    );
  }
}
