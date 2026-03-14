import React from 'react';
import type { MandateStatus } from '../../types/admin-fee';

const STATUS_LABELS: Record<MandateStatus, string> = {
  pending_customer_approval: 'Pending approval',
  pending_submission: 'Pending submission',
  submitted: 'Submitted',
  active: 'Active',
  failed: 'Failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const STATUS_VARIANT: Record<MandateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  submitted: 'warning',
  pending_customer_approval: 'warning',
  pending_submission: 'warning',
  failed: 'error',
  cancelled: 'error',
  expired: 'error',
};

interface MandateStatusBadgeProps {
  status: MandateStatus;
}

export function MandateStatusBadge({ status }: MandateStatusBadgeProps) {
  const variant = STATUS_VARIANT[status];
  return (
    <span className={`badge badge--${variant}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
