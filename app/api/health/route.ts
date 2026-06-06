import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    database: "checking...",
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  try {
    // Test DB connection
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = "connected";

    return NextResponse.json({ status: "healthy", ...checks });
  } catch (error: any) {
    checks.database = "error";
    checks.error = error.message;
    return NextResponse.json(
      { status: "unhealthy", ...checks },
      { status: 500 }
    );
  }
}
