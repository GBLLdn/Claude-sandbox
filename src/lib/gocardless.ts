/**
 * GoCardless integration helpers
 *
 * These are thin wrappers around the GoCardless API.
 * In production, the actual GC API calls should be made server-side
 * (API key must not be exposed to the browser).
 *
 * Each function here represents a server action / API route call.
 */

import type {
  GCBillingRequestFlowUrl,
  GCBillingRequestResult,
  GoCardlessMandate,
  AdminFeePayment,
} from '../types/admin-fee';

// ─── Mandate setup ─────────────────────────────────────────────────────────

/**
 * Server: Create a GoCardless Billing Request and return the hosted flow URL.
 * The user is redirected to GC to enter bank details.
 *
 * POST /api/payments/billing-request
 */
export async function createBillingRequest(
  orgId: string,
  returnUrl: string
): Promise<GCBillingRequestFlowUrl> {
  const res = await fetch('/api/payments/billing-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, returnUrl }),
  });
  if (!res.ok) throw new Error('Failed to create billing request');
  return res.json();
}

/**
 * Server: Called when GoCardless redirects back to our app.
 * Confirms the billing request was completed and retrieves the mandate.
 *
 * POST /api/payments/confirm-mandate
 */
export async function confirmMandate(
  billingRequestId: string
): Promise<GCBillingRequestResult> {
  const res = await fetch('/api/payments/confirm-mandate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ billingRequestId }),
  });
  if (!res.ok) throw new Error('Failed to confirm mandate');
  return res.json();
}

/**
 * Server: Cancel the org's current mandate.
 *
 * POST /api/payments/cancel-mandate
 */
export async function cancelMandate(orgId: string): Promise<void> {
  const res = await fetch('/api/payments/cancel-mandate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId }),
  });
  if (!res.ok) throw new Error('Failed to cancel mandate');
}

// ─── Payments ──────────────────────────────────────────────────────────────

/**
 * Server: Manually retry a failed payment (if mandate is still valid).
 *
 * POST /api/payments/:paymentId/retry
 */
export async function retryPayment(paymentId: string): Promise<AdminFeePayment> {
  const res = await fetch(`/api/payments/${paymentId}/retry`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry payment');
  return res.json();
}

// ─── Webhook event types (server-side reference) ──────────────────────────

export type GCWebhookAction =
  | 'mandates/created'
  | 'mandates/active'
  | 'mandates/failed'
  | 'mandates/cancelled'
  | 'mandates/expired'
  | 'payments/paid_out'
  | 'payments/failed'
  | 'payments/cancelled';

export interface GCWebhookEvent {
  id: string;
  action: GCWebhookAction;
  links: {
    mandate?: string;
    payment?: string;
    organisation?: string;
  };
  details: {
    cause: string;
    description: string;
    reasonCode?: string;
  };
  created_at: string;
}

/**
 * Map of GC webhook actions to the business logic they should trigger.
 *
 * Implement these handlers in your webhook route.
 */
export const WEBHOOK_HANDLERS: Record<GCWebhookAction, string> = {
  'mandates/active':     'Mark org mandate as active; unlock purchases',
  'mandates/failed':     'Mark org mandate as failed; prompt re-setup',
  'mandates/cancelled':  'Mark org mandate as cancelled; block purchases',
  'mandates/expired':    'Mark org mandate as expired; prompt re-setup',
  'mandates/created':    'Store mandate reference on org record',
  'payments/paid_out':   'Mark payment as paid; generate invoice PDF',
  'payments/failed':     'Mark payment as failed; email org admin; block purchases',
  'payments/cancelled':  'Mark payment as cancelled',
};
