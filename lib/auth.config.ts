import type { NextAuthConfig } from "next-auth";export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      }
    }
  },
  secret: process.env.AUTH_SECRET || "1fac3ae321d234091f73bd6ddf3522f5f2cb6c94fa122705690964f05b972b7d",
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  providers: [],
} satisfies NextAuthConfig;
