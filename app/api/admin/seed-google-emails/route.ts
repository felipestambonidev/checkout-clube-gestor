import { NextRequest, NextResponse } from "next/server";
import { addAuthorizedEmail } from "@/lib/admin-emails";

// Emails autorizados a fazer login com Google
const AUTHORIZED_EMAILS = [
  "icaro.queiroz@fitgestao.com",
  "taynan.queiroz@fitgestao.com",
  "michelle.campos@fitgestao.com",
  "paulo.rodrigues@fitgestao.com",
  "felipe.stamboni@fitgestao.com.br",
  "twane.alves@fitgestao.com",
];

/**
 * POST /api/admin/seed-google-emails
 *
 * Popula a tabela "emails-google-admin" com os emails autorizados.
 * Protegido pelo header X-Admin-Secret.
 *
 * Uso (após deploy):
 *   curl -X POST https://checkout.clubegestor.com/api/admin/seed-google-emails \
 *     -H "X-Admin-Secret: SEU_ADMIN_API_SECRET"
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  const expectedSecret = process.env.ADMIN_API_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const results: { email: string; status: "ok" | "error"; message?: string }[] = [];

  for (const email of AUTHORIZED_EMAILS) {
    try {
      await addAuthorizedEmail(email);
      console.log(`[SeedGoogleEmails] Inserido: ${email}`);
      results.push({ email, status: "ok" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SeedGoogleEmails] Erro ao inserir ${email}: ${message}`);
      results.push({ email, status: "error", message });
    }
  }

  const successCount = results.filter((r) => r.status === "ok").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    success: errorCount === 0,
    summary: `${successCount} inseridos, ${errorCount} erros`,
    results,
  });
}
