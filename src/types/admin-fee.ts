// ─── GoCardless Mandate ────────────────────────────────────────────────────

export type MandateStatus =
  | 'pending_customer_approval'
  | 'pending_submission'
  | 'submitted'
  | 'active'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface GoCardlessMandate {
  id: string; // GC mandate ID e.g. "MD000123"
  status: MandateStatus;
  bankName: string;
  accountNumberEnding: string; // last 4 digits
  sortCode: string; // last 2 digits, display only
  createdAt: string; // ISO date
  reference: string; // DD reference shown on bank statement
}

// ─── Organisation ─────────────────────────────────────────────────────────

export type OrgPaymentStatus =
  | 'pending_setup'   // no mandate yet — blocks purchases
  | 'active'          // mandate + payments healthy
  | 'payment_failed'  // last charge failed — blocks purchases
  | 'suspended';      // manually suspended by platform admin

export interface OrgBillingProfile {
  orgId: string;
  mandate: GoCardlessMandate | null;
  paymentStatus: OrgPaymentStatus;
  /** Overrides platform default when set */
  customFeeAmountPence: number | null;
  /** Whether this org is exempt from the admin fee */
  feeExempt: boolean;
  nextChargeDate: string | null; // ISO date
  lastPaymentAt: string | null;
}

// ─── Payments ─────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'pending_submission'
  | 'submitted'
  | 'confirmed'
  | 'paid_out'
  | 'failed'
  | 'cancelled'
  | 'customer_approval_denied';

export interface AdminFeePayment {
  id: string;
  orgId: string;
  gcPaymentId: string; // GoCardless payment ID
  amountPence: number;
  status: PaymentStatus;
  chargeDate: string; // ISO date — when GC will collect
  paidAt: string | null; // ISO date — when confirmed paid
  failedAt: string | null;
  failureReason: string | null;
  invoiceId: string | null;
  invoiceUrl: string | null;
}

// ─── Invoices ─────────────────────────────────────────────────────────────

export interface AdminFeeInvoice {
  id: string;
  paymentId: string;
  orgId: string;
  number: string; // e.g. "INV-2024-0042"
  amountPence: number;
  vatAmountPence: number;
  totalPence: number;
  issuedAt: string;
  pdfUrl: string;
  periodStart: string;
  periodEnd: string;
}

// ─── Platform Config ──────────────────────────────────────────────────────

export interface AdminFeeConfig {
  enabled: boolean;
  defaultAmountPence: number; // 10000 = £100.00
  billingDayOfMonth: number; // 1–28
  currency: 'GBP';
  perOrgOverrides: OrgFeeOverride[];
}

export interface OrgFeeOverride {
  orgId: string;
  orgName: string;
  customAmountPence: number | null;
  exempt: boolean;
}

// ─── UI State ─────────────────────────────────────────────────────────────

export interface PaymentHistoryFilters {
  status: PaymentStatus | 'all';
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  perPage: 12 | 24 | 48;
}

export interface PaymentSummary {
  outstandingAmountPence: number;
  nextChargeDate: string | null;
  nextChargeAmountPence: number;
  mandateStatus: MandateStatus | null;
  orgPaymentStatus: OrgPaymentStatus;
  lastFailedPayment: AdminFeePayment | null;
}

// ─── GoCardless Billing Request (onboarding) ──────────────────────────────

export interface GCBillingRequestFlowUrl {
  /** Redirect the user to this URL to collect bank details */
  authorisationUrl: string;
  /** Pass as return_url to GoCardless */
  exitUri: string;
}

export interface GCBillingRequestResult {
  mandateId: string;
  billingRequestId: string;
}
