/**
 * PaymentHistory — /payments
 *
 * Shows the full history of admin fee payments for the organisation,
 * with invoice download and status filtering.
 *
 * Accessible to: Org admin, Branch manager
 */

import React, { useState } from 'react';
import type {
  AdminFeePayment,
  PaymentStatus,
  PaymentHistoryFilters,
  PaymentSummary,
} from '../../types/admin-fee';
import { formatPence, formatDate } from '../../lib/format';
import { PaymentSummaryBar } from '../../components/admin-fee/PaymentSummaryBar';
import { PaymentStatusBadge } from '../../components/admin-fee/PaymentStatusBadge';

// ─── Page ──────────────────────────────────────────────────────────────────

interface PaymentHistoryPageProps {
  summary: PaymentSummary;
  payments: AdminFeePayment[];
  totalCount: number;
  filters: PaymentHistoryFilters;
  onFilterChange: (updated: Partial<PaymentHistoryFilters>) => void;
  onDownloadInvoice: (invoiceId: string) => Promise<void>;
  isLoading: boolean;
}

export function PaymentHistoryPage({
  summary,
  payments,
  totalCount,
  filters,
  onFilterChange,
  onDownloadInvoice,
  isLoading,
}: PaymentHistoryPageProps) {
  return (
    <div className="page page--payments">
      <header className="page__header">
        <h1 className="page__title">Payments</h1>
        <p className="page__description">
          Your admin fee payment history and invoices.
        </p>
      </header>

      <PaymentSummaryBar
        nextChargeDate={summary.nextChargeDate}
        nextChargeAmountPence={summary.nextChargeAmountPence}
        orgPaymentStatus={summary.orgPaymentStatus}
        mandateStatus={summary.mandateStatus}
      />

      {summary.lastFailedPayment && (
        <PaymentFailureAlert payment={summary.lastFailedPayment} />
      )}

      <section className="section">
        <PaymentHistoryFiltersBar
          filters={filters}
          onFilterChange={onFilterChange}
        />

        {isLoading ? (
          <div className="loading-state" aria-label="Loading payments…">
            <div className="spinner" />
          </div>
        ) : payments.length === 0 ? (
          <PaymentHistoryEmptyState filters={filters} />
        ) : (
          <PaymentTable
            payments={payments}
            onDownloadInvoice={onDownloadInvoice}
          />
        )}

        {totalCount > filters.perPage && (
          <Pagination
            page={filters.page}
            perPage={filters.perPage}
            totalCount={totalCount}
            onPageChange={(page) => onFilterChange({ page })}
          />
        )}
      </section>
    </div>
  );
}

// ─── Inline failure alert (within payments page) ──────────────────────────

function PaymentFailureAlert({ payment }: { payment: AdminFeePayment }) {
  return (
    <div className="alert alert--error" role="alert">
      <strong>Payment failed</strong> — {formatPence(payment.amountPence)}{' '}
      due on {formatDate(payment.chargeDate)} could not be collected.
      {payment.failureReason && (
        <span className="alert__reason"> Reason: {payment.failureReason}.</span>
      )}
      {' '}
      <a href="/settings/payments" className="alert__action">
        Update bank details
      </a>
    </div>
  );
}

// ─── Filters bar ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: PaymentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'paid_out', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending_submission', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface PaymentHistoryFiltersBarProps {
  filters: PaymentHistoryFilters;
  onFilterChange: (updated: Partial<PaymentHistoryFilters>) => void;
}

function PaymentHistoryFiltersBar({ filters, onFilterChange }: PaymentHistoryFiltersBarProps) {
  return (
    <div className="filters-bar">
      <div className="filters-bar__group">
        <label className="filters-bar__label" htmlFor="status-filter">
          Status
        </label>
        <select
          id="status-filter"
          className="filters-bar__select"
          value={filters.status}
          onChange={(e) =>
            onFilterChange({
              status: e.target.value as PaymentStatus | 'all',
              page: 1,
            })
          }
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-bar__group">
        <label className="filters-bar__label" htmlFor="date-from">
          From
        </label>
        <input
          id="date-from"
          type="date"
          className="filters-bar__input"
          value={filters.dateFrom ?? ''}
          onChange={(e) =>
            onFilterChange({ dateFrom: e.target.value || null, page: 1 })
          }
        />
      </div>

      <div className="filters-bar__group">
        <label className="filters-bar__label" htmlFor="date-to">
          To
        </label>
        <input
          id="date-to"
          type="date"
          className="filters-bar__input"
          value={filters.dateTo ?? ''}
          onChange={(e) =>
            onFilterChange({ dateTo: e.target.value || null, page: 1 })
          }
        />
      </div>

      {(filters.dateFrom || filters.dateTo || filters.status !== 'all') && (
        <button
          className="btn btn--ghost btn--sm"
          onClick={() =>
            onFilterChange({ dateFrom: null, dateTo: null, status: 'all', page: 1 })
          }
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─── Table ─────────────────────────────────────────────────────────────────

interface PaymentTableProps {
  payments: AdminFeePayment[];
  onDownloadInvoice: (invoiceId: string) => Promise<void>;
}

function PaymentTable({ payments, onDownloadInvoice }: PaymentTableProps) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onDownloadInvoice={onDownloadInvoice}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaymentRowProps {
  payment: AdminFeePayment;
  onDownloadInvoice: (invoiceId: string) => Promise<void>;
}

function PaymentRow({ payment, onDownloadInvoice }: PaymentRowProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!payment.invoiceId) return;
    setIsDownloading(true);
    await onDownloadInvoice(payment.invoiceId);
    setIsDownloading(false);
  }

  return (
    <tr className={payment.status === 'failed' ? 'table__row--error' : undefined}>
      <td>{formatDate(payment.chargeDate)}</td>
      <td className="table__amount">{formatPence(payment.amountPence)}</td>
      <td>
        <PaymentStatusBadge
          status={payment.status}
          failureReason={payment.failureReason ?? undefined}
        />
      </td>
      <td>
        {payment.invoiceId ? (
          <button
            className="btn btn--link"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading…' : 'Download PDF'}
          </button>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────

function PaymentHistoryEmptyState({ filters }: { filters: PaymentHistoryFilters }) {
  const hasFilters =
    filters.status !== 'all' || filters.dateFrom || filters.dateTo;

  return (
    <div className="empty-state">
      {hasFilters ? (
        <p className="empty-state__body">No payments match your filters.</p>
      ) : (
        <p className="empty-state__body">
          No payments yet. Your first payment will appear here once collected.
        </p>
      )}
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, perPage, totalCount, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / perPage);
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalCount);

  return (
    <div className="pagination">
      <span className="pagination__info">
        {from}–{to} of {totalCount}
      </span>
      <div className="pagination__controls">
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
