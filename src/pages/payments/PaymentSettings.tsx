/**
 * PaymentSettings — /settings/payments
 *
 * Accessible to: Org admin, Branch manager
 *
 * Sections:
 *   1. Payment summary bar (next charge, status)
 *   2. Current Direct Debit mandate
 *   3. Update bank details / cancel mandate
 *   4. Notification preferences
 *   5. [Platform admin only] Fee configuration toggle
 */

import React, { useState } from 'react';
import type {
  OrgBillingProfile,
  AdminFeeConfig,
  GoCardlessMandate,
} from '../../types/admin-fee';
import { formatPence, formatDate } from '../../lib/format';
import { MandateStatusBadge } from '../../components/admin-fee/MandateStatusBadge';
import { PaymentSummaryBar } from '../../components/admin-fee/PaymentSummaryBar';
import { FeeConfigPanel } from '../../components/admin-fee/FeeConfigPanel';

interface PaymentSettingsProps {
  billingProfile: OrgBillingProfile;
  feeConfig: AdminFeeConfig;
  isPlatformAdmin: boolean;
  onUpdateBankDetails: () => Promise<void>;
  onCancelMandate: () => Promise<void>;
  onUpdateFeeConfig: (updated: Partial<AdminFeeConfig>) => Promise<void>;
  onUpdateNotificationEmail: (email: string) => Promise<void>;
  notificationEmail: string;
}

export function PaymentSettings({
  billingProfile,
  feeConfig,
  isPlatformAdmin,
  onUpdateBankDetails,
  onCancelMandate,
  onUpdateFeeConfig,
  onUpdateNotificationEmail,
  notificationEmail,
}: PaymentSettingsProps) {
  const { mandate } = billingProfile;

  return (
    <div className="page page--settings-payments">
      <header className="page__header">
        <h1 className="page__title">Payment Settings</h1>
        <p className="page__description">
          Manage your Direct Debit mandate and billing preferences.
        </p>
      </header>

      <PaymentSummaryBar
        nextChargeDate={billingProfile.nextChargeDate}
        nextChargeAmountPence={
          billingProfile.customFeeAmountPence ?? feeConfig.defaultAmountPence
        }
        orgPaymentStatus={billingProfile.paymentStatus}
        mandateStatus={mandate?.status ?? null}
      />

      <section className="settings-section">
        <h2 className="settings-section__title">Direct Debit</h2>

        {mandate ? (
          <MandateCard
            mandate={mandate}
            onUpdateBankDetails={onUpdateBankDetails}
            onCancelMandate={onCancelMandate}
          />
        ) : (
          <NoMandatePrompt />
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Notifications</h2>
        <NotificationEmailForm
          email={notificationEmail}
          onSave={onUpdateNotificationEmail}
        />
      </section>

      {isPlatformAdmin && (
        <section className="settings-section settings-section--admin">
          <div className="settings-section__admin-badge">Platform admin only</div>
          <h2 className="settings-section__title">Fee Configuration</h2>
          <FeeConfigPanel config={feeConfig} onUpdate={onUpdateFeeConfig} />
        </section>
      )}
    </div>
  );
}

// ─── Mandate Card ──────────────────────────────────────────────────────────

interface MandateCardProps {
  mandate: GoCardlessMandate;
  onUpdateBankDetails: () => Promise<void>;
  onCancelMandate: () => Promise<void>;
}

function MandateCard({ mandate, onUpdateBankDetails, onCancelMandate }: MandateCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleUpdate() {
    setIsUpdating(true);
    try {
      await onUpdateBankDetails();
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <div className="mandate-card">
        <div className="mandate-card__row">
          <span className="mandate-card__label">Bank</span>
          <span className="mandate-card__value">{mandate.bankName}</span>
        </div>
        <div className="mandate-card__row">
          <span className="mandate-card__label">Account</span>
          <span className="mandate-card__value">
            ••••&thinsp;{mandate.accountNumberEnding}
          </span>
        </div>
        <div className="mandate-card__row">
          <span className="mandate-card__label">Sort code</span>
          <span className="mandate-card__value">••-••-{mandate.sortCode}</span>
        </div>
        <div className="mandate-card__row">
          <span className="mandate-card__label">Reference</span>
          <span className="mandate-card__value mandate-card__value--mono">
            {mandate.reference}
          </span>
        </div>
        <div className="mandate-card__row">
          <span className="mandate-card__label">Status</span>
          <MandateStatusBadge status={mandate.status} />
        </div>
        <div className="mandate-card__row">
          <span className="mandate-card__label">Set up</span>
          <span className="mandate-card__value">{formatDate(mandate.createdAt)}</span>
        </div>

        <div className="mandate-card__actions">
          <button
            className="btn btn--secondary"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? 'Loading…' : 'Update bank details'}
          </button>
          <button
            className="btn btn--danger-ghost"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel mandate
          </button>
        </div>
      </div>

      {showCancelModal && (
        <CancelMandateModal
          onConfirm={async () => {
            await onCancelMandate();
            setShowCancelModal(false);
          }}
          onDismiss={() => setShowCancelModal(false)}
        />
      )}
    </>
  );
}

// ─── Cancel confirmation modal ─────────────────────────────────────────────

interface CancelMandateModalProps {
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}

function CancelMandateModal({ onConfirm, onDismiss }: CancelMandateModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h2 className="modal__title">Cancel Direct Debit?</h2>
        <div className="modal__body">
          <p>
            Cancelling your Direct Debit mandate will <strong>pause your
            account</strong>. You will not be able to make vehicle purchases
            until a new mandate is set up.
          </p>
          <p>
            Any outstanding payments will still be collected. You can set up
            a new mandate at any time.
          </p>
        </div>
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onDismiss}>
            Keep mandate
          </button>
          <button
            className="btn btn--danger"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Cancelling…' : 'Yes, cancel mandate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── No mandate state ──────────────────────────────────────────────────────

function NoMandatePrompt() {
  return (
    <div className="empty-state">
      <p className="empty-state__body">
        No Direct Debit mandate is set up for your account. You need one to
        make vehicle purchases.
      </p>
      <a href="/onboarding/payment-setup" className="btn btn--primary">
        Set up Direct Debit
      </a>
    </div>
  );
}

// ─── Notification email form ───────────────────────────────────────────────

interface NotificationEmailFormProps {
  email: string;
  onSave: (email: string) => Promise<void>;
}

function NotificationEmailForm({ email, onSave }: NotificationEmailFormProps) {
  const [value, setValue] = useState(email);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    await onSave(value);
    setIsSaving(false);
    setSaved(true);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__field">
        <label className="form__label" htmlFor="notif-email">
          Payment notification email
        </label>
        <p className="form__hint">
          We'll send payment confirmations, failure notices, and invoices here.
        </p>
        <input
          id="notif-email"
          type="email"
          className="form__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <div className="form__actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isSaving || value === email}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        {saved && (
          <span className="form__saved-indicator" role="status">
            Saved ✓
          </span>
        )}
      </div>
    </form>
  );
}
