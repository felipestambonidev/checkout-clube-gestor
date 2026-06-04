import { NextResponse } from "next/server";
import { PutCommand, GetCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PARTITION_KEY } from "@/lib/dynamodb";

interface PendingCheckout {
  email: string;
  name: string;
  phone: string;
  company: string;
  cpfCnpj: string;
  event: string;
  finalPrice: number;
  description?: string;
  createdAt: string;
  expiresAt: string;
}

// POST - Salvar checkout pendente (antes do pagamento ASAAS)
export async function POST(request: Request) {
  try {
    const { email, name, phone, company, cpfCnpj, event, finalPrice, description } = await request.json();

    if (!email || !name || !phone || !cpfCnpj) {
      return NextResponse.json(
        { error: "Campos obrigatórios: email, name, phone, cpfCnpj" },
        { status: 400 }
      );
    }

    // Expira em 24 horas
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const pendingCheckout: PendingCheckout = {
      email,
      name,
      phone,
      company: company || "",
      cpfCnpj,
      event: event || "workshop",
      finalPrice: finalPrice || 0,
      description: description || "",
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    // Salvar no DynamoDB com prefixo PENDING_CHECKOUT#
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        [PARTITION_KEY]: `PENDING_CHECKOUT#${email.toLowerCase()}`,
        ...pendingCheckout,
      },
    });

    await docClient.send(putCommand);

    console.log("[v0] Pending checkout saved for:", email);

    return NextResponse.json({
      success: true,
      message: "Checkout pendente salvo com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error saving pending checkout:", error);
    return NextResponse.json(
      { error: "Erro ao salvar checkout pendente" },
      { status: 500 }
    );
  }
}

// GET - Buscar checkout pendente por email
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `PENDING_CHECKOUT#${email.toLowerCase()}`,
      },
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return NextResponse.json(
        { error: "Checkout pendente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se expirou
    if (new Date(result.Item.expiresAt) < new Date()) {
      // Deletar item expirado
      const deleteCommand = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          [PARTITION_KEY]: `PENDING_CHECKOUT#${email.toLowerCase()}`,
        },
      });
      await docClient.send(deleteCommand);

      return NextResponse.json(
        { error: "Checkout pendente expirado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout: {
        email: result.Item.email,
        name: result.Item.name,
        phone: result.Item.phone,
        company: result.Item.company,
        cpfCnpj: result.Item.cpfCnpj,
        event: result.Item.event,
        finalPrice: result.Item.finalPrice,
        description: result.Item.description,
        createdAt: result.Item.createdAt,
      },
    });
  } catch (error) {
    console.error("[v0] Error fetching pending checkout:", error);
    return NextResponse.json(
      { error: "Erro ao buscar checkout pendente" },
      { status: 500 }
    );
  }
}

// DELETE - Remover checkout pendente apos pagamento confirmado
export async function DELETE(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `PENDING_CHECKOUT#${email.toLowerCase()}`,
      },
    });

    await docClient.send(deleteCommand);

    console.log("[v0] Pending checkout deleted for:", email);

    return NextResponse.json({
      success: true,
      message: "Checkout pendente removido com sucesso",
    });
  } catch (error) {
    console.error("[v0] Error deleting pending checkout:", error);
    return NextResponse.json(
      { error: "Erro ao remover checkout pendente" },
      { status: 500 }
    );
  }
}
