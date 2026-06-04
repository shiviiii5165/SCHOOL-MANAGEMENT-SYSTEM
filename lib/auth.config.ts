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
  secret: process.env.AUTH_SECRET,
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
