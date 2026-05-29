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
  providers: [
    Google({
      clientId: googleClientId || "",
      clientSecret: googleClientSecret || "",
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
        return false;
      }
      
      const authorized = await isEmailAuthorized(user.email);
      
      if (!authorized) {
        console.warn(`[Auth] Email não autorizado tentou login: ${user.email}`);
        return false;
      }
      
      console.log(`[Auth] Login Google autorizado: ${user.email}`);
      return true;
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
    maxAge: 4 * 60 * 60, // 4 horas (mesmo tempo do login tradicional)
  },
  trustHost: true,
});
