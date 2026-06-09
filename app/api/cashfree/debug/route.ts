export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/**
 * Debug endpoint to verify Cashfree environment config on Vercel.
 * Access: GET /api/cashfree/debug
 * Remove this after testing is complete.
 */
export async function GET() {
  const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
  const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
  const CASHFREE_ENV = process.env.CASHFREE_ENV || "";
  const FRONTEND_URL = process.env.FRONTEND_URL || "";
  const NEXT_PUBLIC_CASHFREE_ENV = process.env.NEXT_PUBLIC_CASHFREE_ENV || "";

  // Test creating a dummy URL the same way the create-order route does
  const baseUrl = FRONTEND_URL.trim().replace(/\/+$/, "");
  let testReturnUrl = "";
  try {
    const u = new URL(`${baseUrl}/parent/fees`);
    u.searchParams.set("order_id", "DEBUG_TEST_123");
    u.searchParams.set("fee_id", "debug_fee_id");
    testReturnUrl = u.toString();
  } catch (e: any) {
    testReturnUrl = `ERROR: ${e.message}`;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    config: {
      hasAppId: !!CASHFREE_APP_ID,
      appIdPrefix: CASHFREE_APP_ID.slice(0, 8) + "...",
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      secretKeyPrefix: CASHFREE_SECRET_KEY.slice(0, 12) + "...",
      cashfreeEnv: CASHFREE_ENV,
      nextPublicCashfreeEnv: NEXT_PUBLIC_CASHFREE_ENV,
      frontendUrl: FRONTEND_URL,
      frontendUrlLength: FRONTEND_URL.length,
      frontendUrlTrimmed: FRONTEND_URL.trim(),
      frontendUrlTrimmedLength: FRONTEND_URL.trim().length,
      frontendUrlCharCodes: Array.from(FRONTEND_URL).map((c) => c.charCodeAt(0)),
    },
    testReturnUrl,
    isProduction: CASHFREE_ENV === "production",
    apiBaseUrl: CASHFREE_ENV === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg",
  });
}
