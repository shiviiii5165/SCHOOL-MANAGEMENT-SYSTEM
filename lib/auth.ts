import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { z } from "zod";
import { checkLoginRateLimit, resetLoginAttempts } from './security/rateLimiter'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          const ip = (req.headers.get ? req.headers.get('x-forwarded-for') : (req.headers as any)?.['x-forwarded-for']) as string
                  ?? (req.headers.get ? req.headers.get('x-real-ip') : (req.headers as any)?.['x-real-ip']) as string
                  ?? 'unknown'

          const parsedCredentials = loginSchema.safeParse(credentials);

          if (!parsedCredentials.success) {
            throw new Error('Invalid credentials');
          }

          const { email, password } = parsedCredentials.data;
          const identifier = `${ip}:${email}`
          const limit = checkLoginRateLimit(identifier)

          if (!limit.allowed) {
            throw new Error(`Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`)
          }

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
          });

          // IMPORTANT: Always run bcrypt compare even if user not found
          // This prevents timing attacks that reveal valid emails
          const passwordToCheck = user?.password ?? '$2a$12$invalidhashtopreventtimingattack'
          const passwordsMatch = await bcrypt.compare(password, passwordToCheck);

          if (!user || !passwordsMatch) {
            throw new Error('Invalid credentials');
          }

          if (!user.isActive) {
            throw new Error('Account is disabled. Contact administration.')
          }

          resetLoginAttempts(identifier)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          if (error.message && error.message.includes("Can't reach database server")) {
            throw new Error("DATABASE_CONNECTION_ERROR");
          }
          throw error;
        }
      }
    })
  ]
});
