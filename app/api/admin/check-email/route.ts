import { NextRequest, NextResponse } from "next/server";
import { listAuthorizedEmails, isEmailAuthorized } from "@/lib/admin-emails";

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email");

  if (email) {
    const authorized = await isEmailAuthorized(email);
    return NextResponse.json({ email, authorized });
  }

  const emails = await listAuthorizedEmails();
  return NextResponse.json({ emails, total: emails.length });
}
