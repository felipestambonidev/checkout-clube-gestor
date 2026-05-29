import { NextResponse } from "next/server";
import { addAuthorizedEmail, removeAuthorizedEmail, listAuthorizedEmails } from "@/lib/admin-emails";

// Middleware para verificar o token secreto
function verifyAdminSecret(request: Request): boolean {
  const secret = request.headers.get("X-Admin-Secret");
  const expectedSecret = process.env.ADMIN_API_SECRET;
  
  if (!expectedSecret) {
    console.error("[AdminEmails] ADMIN_API_SECRET não configurado");
    return false;
  }
  
  return secret === expectedSecret;
}

// GET - Listar emails autorizados
export async function GET(request: Request) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }
  
  try {
    const emails = await listAuthorizedEmails();
    return NextResponse.json({ emails });
  } catch (error) {
    console.error("[AdminEmails] Erro ao listar emails:", error);
    return NextResponse.json(
      { error: "Erro ao listar emails autorizados" },
      { status: 500 }
    );
  }
}

// POST - Adicionar email autorizado
export async function POST(request: Request) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }
  
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }
    
    await addAuthorizedEmail(email);
    
    console.log(`[AdminEmails] Email adicionado: ${email}`);
    return NextResponse.json({ 
      success: true, 
      message: `Email ${email} autorizado com sucesso` 
    });
  } catch (error) {
    console.error("[AdminEmails] Erro ao adicionar email:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar email autorizado" },
      { status: 500 }
    );
  }
}

// DELETE - Remover email autorizado
export async function DELETE(request: Request) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }
  
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }
    
    const removed = await removeAuthorizedEmail(email);
    
    if (!removed) {
      return NextResponse.json(
        { error: "Email não encontrado" },
        { status: 404 }
      );
    }
    
    console.log(`[AdminEmails] Email removido: ${email}`);
    return NextResponse.json({ 
      success: true, 
      message: `Email ${email} removido com sucesso` 
    });
  } catch (error) {
    console.error("[AdminEmails] Erro ao remover email:", error);
    return NextResponse.json(
      { error: "Erro ao remover email autorizado" },
      { status: 500 }
    );
  }
}
