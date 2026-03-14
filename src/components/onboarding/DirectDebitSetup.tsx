/**
 * DirectDebitSetup
 *
 * Onboarding step: collect Direct Debit mandate via GoCardless.
 * This is a mandatory gate — users cannot make vehicle purchases until
 * a valid mandate exists on their organisation.
 *
 * Flow:
 *   1. Intro screen  — explain what DD is, amount, schedule
 *   2. GC redirect   — user completes bank detail entry on GoCardless hosted page
 *   3. Return screen — confirm mandate, unlock platform
 */

import React, { useState } from 'react';
import type { AdminFeeConfig, GCBillingRequestFlowUrl } from '../../types/admin-fee';
import { formatPence } from '../../lib/format';

// ─── Sub-components ────────────────────────────────────────────────────────

interface DirectDebitIntroProps {
  feeConfig: AdminFeeConfig;
  onContinue: () => void;
  isLoading: boolean;
}

export function DirectDebitIntro({ feeConfig, onContinue, isLoading }: DirectDebitIntroProps) {
  return (
    <div className="dd-setup dd-setup--intro">
      <div className="dd-setup__header">
        <div className="dd-setup__icon" aria-hidden="true">🏦</div>
        <h1 className="dd-setup__title">Set up your Direct Debit</h1>
        <p className="dd-setup__subtitle">
          One last step before you can start purchasing vehicles.
        </p>
      </div>

      <div className="dd-setup__fee-card">
        <div className="dd-setup__fee-amount">
          {formatPence(feeConfig.defaultAmountPence)}
          <span className="dd-setup__fee-period"> / month</span>
        </div>
        <p className="dd-setup__fee-description">
          Admin fee charged on the {ordinal(feeConfig.billingDayOfMonth)} of each month
        </p>
      </div>

      <ul className="dd-setup__benefits">
        <li>
          <CheckIcon />
          Access to the full vehicle marketplace
        </li>
        <li>
          <CheckIcon />
          Automated monthly billing — no manual invoices
        </li>
        <li>
          <CheckIcon />
          Cancel or update your details at any time
        </li>
      </ul>

      <div className="dd-setup__guarantee">
        <img
          src="/images/dd-guarantee.svg"
          alt="Direct Debit Guarantee"
          className="dd-setup__guarantee-logo"
        />
        <p>
          Your payment is protected by the{' '}
          <a
            href="https://www.directdebit.co.uk/direct-debit-guarantee/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Direct Debit Guarantee
          </a>
          . You can cancel at any time and are entitled to a full refund
          if an error is made.
        </p>
      </div>

      <div className="dd-setup__powered-by">
        <span>Payments powered by</span>
        <img src="/images/gocardless-logo.svg" alt="GoCardless" />
      </div>

      <button
        className="btn btn--primary btn--full"
        onClick={onContinue}
        disabled={isLoading}
      >
        {isLoading ? 'Loading…' : 'Set up Direct Debit'}
      </button>

      <p className="dd-setup__legal">
        By continuing, you authorise us to collect {formatPence(feeConfig.defaultAmountPence)}{' '}
        per month from your nominated account. Advance notice will be given of any changes.
      </p>
    </div>
  );
}

// ─── Redirect / Loading screen ─────────────────────────────────────────────

interface DirectDebitRedirectProps {
  flowUrl: GCBillingRequestFlowUrl;
}

export function DirectDebitRedirect({ flowUrl }: DirectDebitRedirectProps) {
  // In practice you'd use window.location.href = flowUrl.authorisationUrl
  // or an iframe embed for a smoother experience.
  React.useEffect(() => {
    window.location.href = flowUrl.authorisationUrl;
  }, [flowUrl.authorisationUrl]);

  return (
    <div className="dd-setup dd-setup--redirecting">
      <div className="dd-setup__spinner" aria-label="Loading GoCardless…" />
      <p>Redirecting to our secure payment setup…</p>
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────

interface DirectDebitSuccessProps {
  bankName: string;
  accountNumberEnding: string;
  nextChargeDate: string;
  feeAmountPence: number;
  onContinue: () => void;
}

export function DirectDebitSuccess({
  bankName,
  accountNumberEnding,
  nextChargeDate,
  feeAmountPence,
  onContinue,
}: DirectDebitSuccessProps) {
  return (
    <div className="dd-setup dd-setup--success">
      <div className="dd-setup__success-icon" aria-hidden="true">✓</div>

      <h1 className="dd-setup__title">Direct Debit set up</h1>
      <p className="dd-setup__subtitle">
        You can now purchase vehicles on the platform.
      </p>

      <div className="dd-setup__mandate-summary">
        <div className="dd-setup__mandate-row">
          <span className="dd-setup__mandate-label">Bank</span>
          <span className="dd-setup__mandate-value">{bankName}</span>
        </div>
        <div className="dd-setup__mandate-row">
          <span className="dd-setup__mandate-label">Account ending</span>
          <span className="dd-setup__mandate-value">••••{accountNumberEnding}</span>
        </div>
        <div className="dd-setup__mandate-row">
          <span className="dd-setup__mandate-label">First payment</span>
          <span className="dd-setup__mandate-value">
            {formatPence(feeAmountPence)} on {formatDate(nextChargeDate)}
          </span>
        </div>
      </div>

      <p className="dd-setup__confirmation-note">
        A confirmation email has been sent with your Direct Debit details.
      </p>

      <button className="btn btn--primary btn--full" onClick={onContinue}>
        Go to dashboard
      </button>
    </div>
  );
}

// ─── Incomplete mandate banner (shown site-wide) ───────────────────────────

interface MandatePendingBannerProps {
  onSetupClick: () => void;
}

export function MandatePendingBanner({ onSetupClick }: MandatePendingBannerProps) {
  return (
    <div className="banner banner--warning" role="alert">
      <span className="banner__icon" aria-hidden="true">⚠</span>
      <p className="banner__message">
        <strong>Action required:</strong> Complete your Direct Debit setup to
        unlock vehicle purchases.
      </p>
      <button className="btn btn--sm btn--warning-outline" onClick={onSetupClick}>
        Set up now
      </button>
    </div>
  );
}

// ─── Orchestrator ──────────────────────────────────────────────────────────

type SetupStep = 'intro' | 'redirecting' | 'success';

interface DirectDebitSetupWizardProps {
  feeConfig: AdminFeeConfig;
  /** Call this to create a GC Billing Request and get the redirect URL */
  onCreateBillingRequest: () => Promise<GCBillingRequestFlowUrl>;
  /** Called after the GC flow returns and mandate is confirmed */
  onMandateConfirmed: () => void;
  /** Pre-populated from GC return URL params */
  returnedMandateId?: string;
  returnedBankName?: string;
  returnedAccountEnding?: string;
  nextChargeDate?: string;
}

export function DirectDebitSetupWizard({
  feeConfig,
  onCreateBillingRequest,
  onMandateConfirmed,
  returnedMandateId,
  returnedBankName,
  returnedAccountEnding,
  nextChargeDate,
}: DirectDebitSetupWizardProps) {
  const [step, setStep] = useState<SetupStep>(
    returnedMandateId ? 'success' : 'intro'
  );
  const [flowUrl, setFlowUrl] = useState<GCBillingRequestFlowUrl | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinueFromIntro() {
    setIsLoading(true);
    setError(null);
    try {
      const url = await onCreateBillingRequest();
      setFlowUrl(url);
      setStep('redirecting');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 'intro') {
    return (
      <>
        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}
        <DirectDebitIntro
          feeConfig={feeConfig}
          onContinue={handleContinueFromIntro}
          isLoading={isLoading}
        />
      </>
    );
  }

  if (step === 'redirecting' && flowUrl) {
    return <DirectDebitRedirect flowUrl={flowUrl} />;
  }

  if (step === 'success') {
    return (
      <DirectDebitSuccess
        bankName={returnedBankName ?? 'Your bank'}
        accountNumberEnding={returnedAccountEnding ?? '••••'}
        nextChargeDate={nextChargeDate ?? ''}
        feeAmountPence={feeConfig.defaultAmountPence}
        onContinue={onMandateConfirmed}
      />
    );
  }

  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13 4L6.5 11 3 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
