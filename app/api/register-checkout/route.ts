import { NextResponse } from "next/server";
import { PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

interface CheckoutUser {
  name: string;
  phone: string;
  email: string;
  company: string;
  cpfCnpj: string;
  event: string;
  finalPrice: number;
  createdAt: string;
}

// POST - Registrar novo checkout sem cupom
export async function POST(request: Request) {
  try {
    const { name, phone, email, company, cpfCnpj, event, finalPrice } = await request.json();

    if (!name || !phone || !email || !company || !cpfCnpj) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    const checkout: CheckoutUser = {
      name,
      phone,
      email,
      company,
      cpfCnpj,
      event: event || "workshop",
      finalPrice: finalPrice || 0,
      createdAt: new Date().toISOString(),
    };

    // Salvar no DynamoDB com prefixo CHECKOUT#
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        [PARTITION_KEY]: `CHECKOUT#${email}#${Date.now()}`,
        ...checkout,
      },
    });

    await docClient.send(putCommand);

    return NextResponse.json({
      success: true,
      message: "Checkout registrado com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error registering checkout:", error);
    return NextResponse.json(
      { error: "Erro ao registrar checkout" },
      { status: 500 }
    );
  }
}

// GET - Listar todos os checkouts sem cupom
export async function GET() {
  try {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(#pk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": PARTITION_KEY,
      },
      ExpressionAttributeValues: {
        ":prefix": "CHECKOUT#",
      },
    });

    const { Items } = await docClient.send(scanCommand);

    const checkouts = (Items || []).map((item) => ({
      id: item[PARTITION_KEY],
      name: item.name,
      phone: item.phone,
      email: item.email,
      company: item.company,
      cpfCnpj: item.cpfCnpj,
      event: item.event,
      finalPrice: item.finalPrice,
      createdAt: item.createdAt,
    }));

    // Ordenar por data de criação (mais recentes primeiro)
    checkouts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ checkouts });
  } catch (error) {
    console.error("[v0] Error fetching checkouts:", error);
    return NextResponse.json(
      { error: "Erro ao buscar checkouts" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um checkout
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      );
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: id,
      },
    });

    await docClient.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: "Checkout excluído com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error deleting checkout:", error);
    return NextResponse.json(
      { error: "Erro ao excluir checkout" },
      { status: 500 }
    );
  }
}
