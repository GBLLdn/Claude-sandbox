import React from 'react';
import type { PaymentStatus } from '../../types/admin-fee';

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: 'success' | 'error' | 'warning' | 'neutral' }
> = {
  paid_out: { label: 'Paid', variant: 'success' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  customer_approval_denied: { label: 'Denied', variant: 'error' },
  pending_submission: { label: 'Pending', variant: 'warning' },
  submitted: { label: 'Processing', variant: 'warning' },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  failureReason?: string;
}

export function PaymentStatusBadge({ status, failureReason }: PaymentStatusBadgeProps) {
  const { label, variant } = STATUS_CONFIG[status];
  return (
    <span
      className={`badge badge--${variant}`}
      title={failureReason}
      aria-label={failureReason ? `${label}: ${failureReason}` : label}
    >
      {label}
      {failureReason && <span className="badge__info-icon" aria-hidden="true">ⓘ</span>}
    </span>
  );
}
