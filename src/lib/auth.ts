import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/passwords";
import { enforceRateLimit } from "@/lib/security/rate-limit";

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const secureCookie = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookie,
      },
    },
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const limited = await enforceRateLimit(`login:${email}`, 10, 15 * 60 * 1000);
        if (!limited.ok) throw new TooManyAttempts();

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        if (!user.emailVerified) throw new EmailNotVerified();

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.businessName ?? user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
