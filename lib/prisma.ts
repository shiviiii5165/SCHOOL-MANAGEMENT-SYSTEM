import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure connection_limit is at least 10 to prevent pool exhaustion
function ensureConnectionLimit(url: string | undefined): string | undefined {
  if (!url) return url;
  // Replace connection_limit=1 with connection_limit=10
  if (url.includes('connection_limit=1&') || url.endsWith('connection_limit=1')) {
    return url.replace(/connection_limit=1/, 'connection_limit=10');
  }
  // If no connection_limit set, add it
  if (!url.includes('connection_limit=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}connection_limit=10`;
  }
  return url;
}

// Config for Prisma
const prismaConfig = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: ensureConnectionLimit(process.env.DATABASE_URL)
    }
  }
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaConfig as any);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

prisma.$use(async (params, next) => {
  const start = Date.now();
  try {
    const result = await next(params);
    const duration = Date.now() - start;
    if (duration > 2000) {
      console.warn(`[SLOW QUERY]: ${params.model}.${params.action} took ${duration}ms`);
    }
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error(`[DB Error] ${params.model}.${params.action} failed after ${duration}ms:`, error.code || 'unknown', error.message);
    // Re-throw the original error so API routes can handle it properly
    throw error;
  }
});

/**
 * Utility function to execute a database query with automatic retries for connection timeouts (like Supabase cold starts).
 * Useful for critical API endpoints where the DB might be asleep.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const isConnectionError = error?.code === 'P1001' || error?.message?.includes('Can\'t reach database server');
      
      if (!isConnectionError || attempt >= maxRetries) {
        if (attempt >= maxRetries && isConnectionError) {
          console.error(`[DB Error] Connection failed after ${maxRetries} attempts. DB might be down.`);
        }
        throw error;
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
      console.warn(`[DB Warning] Connection attempt ${attempt} failed (P1001). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Unreachable");
}
