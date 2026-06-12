import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAuthorized } from "@/lib/admin-emails";

// Validação das variáveis de ambiente obrigatórias
const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
const authSecret = process.env.AUTH_SECRET;

if (!googleClientId) {
  console.error("[Auth] AUTH_GOOGLE_ID não está configurado!");
}
if (!googleClientSecret) {
  console.error("[Auth] AUTH_GOOGLE_SECRET não está configurado!");
}
if (!authSecret) {
  console.error("[Auth] AUTH_SECRET não está configurado!");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  // AUTH_URL deve ser a URL pública do site em produção (ex: https://checkout.clubegestor.com)
  // Em desenvolvimento é detectada automaticamente
  ...(process.env.AUTH_URL ? { basePath: "/api/auth" } : {}),
  providers: [
    Google({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/admin",
    error: "/admin",
  },
  callbacks: {
    async signIn({ user }) {
      // Verifica se o email está autorizado no DynamoDB
      if (!user.email) {
        console.warn("[Auth] Tentativa de login sem email");
        return false;
      }

      try {
        const authorized = await isEmailAuthorized(user.email);

        if (!authorized) {
          console.warn(`[Auth] Email não autorizado tentou login: ${user.email}`);
          return "/admin?error=AccessDenied";
        }

        console.log(`[Auth] Login Google autorizado: ${user.email}`);
        return true;
      } catch (err) {
        console.error("[Auth] Erro ao verificar autorização no DynamoDB:", err);
        // Falha segura: nega o acesso se o DynamoDB estiver indisponível
        return "/admin?error=DatabaseError";
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 horas
  },
  trustHost: true,
});
