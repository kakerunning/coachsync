// NextAuth v5 configuration with a custom credentials provider (email + bcrypt).
// Uses JWT sessions — no session table is created in the database.
// id and role are not standard OIDC fields, so they must be explicitly copied
// through the jwt callback (sign-in) and the session callback (every request).
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Normalise email so "User@Test.com" and "user@test.com" resolve to the same account.
        const email = (credentials.email as string).toLowerCase().trim();

        let user;
        try {
          user = await db.user.findUnique({ where: { email } });
        } catch (err) {
          console.error("[authorize] DB error:", err);
          throw err;
        }

        if (!user) {
          console.error("[authorize] No user found for email:", email);
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) {
          console.error("[authorize] Password mismatch for:", email);
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // user is only present on the initial sign-in call; on every subsequent
      // request only token is available. Copy custom fields into the token here
      // so they survive across requests.
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      // Expose id and role on session.user so API routes and server components
      // can access them via auth() without an extra DB lookup.
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
