import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const ADMIN_USERNAME = "admin-clube-gestor";
    const ADMIN_PASSWORD = "Fit@1234";

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao autenticar" },
      { status: 500 }
    );
  }
}
