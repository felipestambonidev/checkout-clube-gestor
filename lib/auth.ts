import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAuthorized } from "@/lib/admin-emails";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
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
