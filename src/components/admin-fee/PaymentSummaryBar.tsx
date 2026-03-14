import React from 'react';
import type { OrgPaymentStatus, MandateStatus } from '../../types/admin-fee';
import { formatPence, formatDate } from '../../lib/format';

interface PaymentSummaryBarProps {
  nextChargeDate: string | null;
  nextChargeAmountPence: number;
  orgPaymentStatus: OrgPaymentStatus;
  mandateStatus: MandateStatus | null;
}

export function PaymentSummaryBar({
  nextChargeDate,
  nextChargeAmountPence,
  orgPaymentStatus,
  mandateStatus,
}: PaymentSummaryBarProps) {
  return (
    <div className="summary-bar">
      <SummaryTile
        label="Next payment"
        value={
          nextChargeDate
            ? `${formatPence(nextChargeAmountPence)} on ${formatDate(nextChargeDate)}`
            : '—'
        }
      />
      <SummaryTile
        label="Account status"
        value={<OrgStatusChip status={orgPaymentStatus} />}
      />
      <SummaryTile
        label="Mandate"
        value={<MandateChip status={mandateStatus} />}
      />
    </div>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="summary-bar__tile">
      <span className="summary-bar__label">{label}</span>
      <span className="summary-bar__value">{value}</span>
    </div>
  );
}

function OrgStatusChip({ status }: { status: OrgPaymentStatus }) {
  const map: Record<OrgPaymentStatus, { label: string; variant: string }> = {
    active: { label: 'Active', variant: 'success' },
    payment_failed: { label: 'Payment failed', variant: 'error' },
    pending_setup: { label: 'Setup required', variant: 'warning' },
    suspended: { label: 'Suspended', variant: 'error' },
  };
  const { label, variant } = map[status];
  return <span className={`badge badge--${variant}`}>{label}</span>;
}

function MandateChip({ status }: { status: MandateStatus | null }) {
  if (!status) {
    return <span className="badge badge--neutral">None</span>;
  }
  const isActive = status === 'active';
  return (
    <span className={`badge badge--${isActive ? 'success' : 'warning'}`}>
      {isActive ? 'Active' : 'Pending'}
    </span>
  );
}
