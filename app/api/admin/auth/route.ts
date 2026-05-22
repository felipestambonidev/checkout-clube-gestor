import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Credenciais devem vir de variaveis de ambiente (seguras)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin-clube-gestor";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // Verificar se a senha esta configurada nas variaveis de ambiente
    if (!ADMIN_PASSWORD) {
      console.error("[Auth] ADMIN_PASSWORD nao configurada nas variaveis de ambiente");
      return NextResponse.json(
        { error: "Configuracao de seguranca ausente" },
        { status: 500 }
      );
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Gerar um token de sessao simples
      const sessionToken = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
      
      const response = NextResponse.json({ success: true });
      
      // Definir cookie HTTP-only para maior seguranca
      response.cookies.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 4, // 4 horas
        path: "/",
      });
      
      return response;
    }

    // Log de tentativa de login invalida (sem expor detalhes)
    console.warn("[Auth] Tentativa de login invalida");

    return NextResponse.json(
      { error: "Credenciais invalidas" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[Auth] Erro ao autenticar:", error);
    return NextResponse.json(
      { error: "Erro ao autenticar" },
      { status: 500 }
    );
  }
}
