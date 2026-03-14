/**
 * PaymentFailureBanner
 *
 * Persistent global banner shown on every page when the org has a failed payment.
 * Non-dismissible. Links to payment settings to resolve.
 *
 * Usage: render at the top of your app shell when orgPaymentStatus === 'payment_failed'
 */

import React from 'react';
import type { AdminFeePayment } from '../../types/admin-fee';
import { formatPence, formatDate } from '../../lib/format';

interface PaymentFailureBannerProps {
  failedPayment: AdminFeePayment;
  /** href to payment settings — defaults to /settings/payments */
  settingsHref?: string;
}

export function PaymentFailureBanner({
  failedPayment,
  settingsHref = '/settings/payments',
}: PaymentFailureBannerProps) {
  return (
    <div className="global-banner global-banner--error" role="alert" aria-live="assertive">
      <div className="global-banner__icon" aria-hidden="true">
        <WarningIcon />
      </div>
      <div className="global-banner__content">
        <p className="global-banner__message">
          <strong>Payment failed.</strong>{' '}
          Your {formatPence(failedPayment.amountPence)} payment due on{' '}
          {formatDate(failedPayment.chargeDate)} could not be collected.
          New vehicle purchases are paused until this is resolved.
        </p>
        {failedPayment.failureReason && (
          <p className="global-banner__detail">
            Reason: {failedPayment.failureReason}
          </p>
        )}
      </div>
      <a
        href={settingsHref}
        className="btn btn--sm btn--error-outline global-banner__cta"
      >
        Resolve now
      </a>
    </div>
  );
}

// ─── Purchase blocker (inline, shown on vehicle purchase CTA) ─────────────

interface PurchaseBlockerProps {
  reason: 'payment_failed' | 'pending_setup';
  settingsHref?: string;
}

export function PurchaseBlocker({
  reason,
  settingsHref = '/settings/payments',
}: PurchaseBlockerProps) {
  const messages: Record<typeof reason, string> = {
    payment_failed:
      'Purchases are paused due to a payment issue. Please resolve this before continuing.',
    pending_setup:
      'You need to set up a Direct Debit before making your first purchase.',
  };

  const ctaLabels: Record<typeof reason, string> = {
    payment_failed: 'Go to payment settings',
    pending_setup: 'Set up Direct Debit',
  };

  const ctaHrefs: Record<typeof reason, string> = {
    payment_failed: settingsHref,
    pending_setup: '/onboarding/payment-setup',
  };

  return (
    <div className="purchase-blocker" role="alert">
      <div className="purchase-blocker__icon" aria-hidden="true">
        <LockIcon />
      </div>
      <p className="purchase-blocker__message">{messages[reason]}</p>
      <a href={ctaHrefs[reason]} className="btn btn--primary btn--sm">
        {ctaLabels[reason]}
      </a>
    </div>
  );
}

// ─── HOC / Gate ────────────────────────────────────────────────────────────

import type { OrgPaymentStatus } from '../../types/admin-fee';

interface AdminFeeGateProps {
  orgPaymentStatus: OrgPaymentStatus;
  /** When true (pilot mode), gate is inactive — always allows through */
  feeEnabled: boolean;
  children: React.ReactNode;
}

/**
 * Wrap around any purchase CTA / flow entry point.
 * When the org's billing status would block a purchase, renders
 * a PurchaseBlocker instead of the children.
 */
export function AdminFeeGate({
  orgPaymentStatus,
  feeEnabled,
  children,
}: AdminFeeGateProps) {
  // During pilot the fee is disabled — no blocking
  if (!feeEnabled) {
    return <>{children}</>;
  }

  if (orgPaymentStatus === 'pending_setup') {
    return <PurchaseBlocker reason="pending_setup" />;
  }

  if (orgPaymentStatus === 'payment_failed' || orgPaymentStatus === 'suspended') {
    return <PurchaseBlocker reason="payment_failed" />;
  }

  return <>{children}</>;
}

// ─── Icons ─────────────────────────────────────────────────────────────────

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2L2 17h16L10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 9V6a3 3 0 016 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="13.5" r="1.25" fill="currentColor" />
    </svg>
  );
}
