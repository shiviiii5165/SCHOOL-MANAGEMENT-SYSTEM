/**
 * Cashfree Payment Service
 * Frontend API wrapper for Cashfree payment gateway integration.
 */

export interface CreateOrderRequest {
  invoiceId: string;
  amount: number;
  paymentMode: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  paymentSessionId: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  updatedFees?: any[];
  status?: string;
}

/**
 * Create a Cashfree payment order
 * Calls POST /api/cashfree/create-order
 */
export async function createCashfreeOrder(
  data: CreateOrderRequest
): Promise<CreateOrderResponse> {
  const res = await fetch("/api/cashfree/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Failed to create payment order");
  }

  return json;
}

/**
 * Verify a Cashfree payment after redirect
 * Calls POST /api/cashfree/verify-payment
 */
export async function verifyCashfreePayment(
  data: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> {
  const res = await fetch("/api/cashfree/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Failed to verify payment");
  }

  return json;
}
