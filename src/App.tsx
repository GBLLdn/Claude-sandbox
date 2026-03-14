import React, { useState } from 'react';
import type {
  OrgBillingProfile,
  AdminFeeConfig,
  AdminFeePayment,
  PaymentHistoryFilters,
  PaymentSummary,
} from './types/admin-fee';
import { PaymentSettings } from './pages/payments/PaymentSettings';
import { PaymentHistoryPage } from './pages/payments/PaymentHistory';
import { DirectDebitIntro, DirectDebitSuccess, MandatePendingBanner } from './components/onboarding/DirectDebitSetup';
import { PaymentFailureBanner } from './components/admin-fee/PaymentFailureBanner';

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_FEE_CONFIG: AdminFeeConfig = {
  enabled: true,
  defaultAmountPence: 10000,
  billingDayOfMonth: 1,
  currency: 'GBP',
  perOrgOverrides: [
    { orgId: 'org_001', orgName: 'Acme Motors Ltd', customAmountPence: 5000, exempt: false },
    { orgId: 'org_002', orgName: 'Speedway Group', customAmountPence: null, exempt: true },
  ],
};

const MOCK_BILLING_PROFILE: OrgBillingProfile = {
  orgId: 'org_123',
  mandate: {
    id: 'MD000123',
    status: 'active',
    bankName: 'Barclays',
    accountNumberEnding: '4567',
    sortCode: '12',
    createdAt: '2024-09-15',
    reference: 'FLEET-ORG-123',
  },
  paymentStatus: 'active',
  customFeeAmountPence: null,
  feeExempt: false,
  nextChargeDate: '2026-04-01',
  lastPaymentAt: '2026-03-01',
};

const MOCK_FAILED_PAYMENT: AdminFeePayment = {
  id: 'pay_001',
  orgId: 'org_123',
  gcPaymentId: 'PM000456',
  amountPence: 10000,
  status: 'failed',
  chargeDate: '2026-03-01',
  paidAt: null,
  failedAt: '2026-03-02',
  failureReason: 'Insufficient funds',
  invoiceId: null,
  invoiceUrl: null,
};

const MOCK_PAYMENTS: AdminFeePayment[] = [
  {
    id: 'pay_006',
    orgId: 'org_123',
    gcPaymentId: 'PM000006',
    amountPence: 10000,
    status: 'failed',
    chargeDate: '2026-03-01',
    paidAt: null,
    failedAt: '2026-03-02',
    failureReason: 'Insufficient funds',
    invoiceId: null,
    invoiceUrl: null,
  },
  {
    id: 'pay_005',
    orgId: 'org_123',
    gcPaymentId: 'PM000005',
    amountPence: 10000,
    status: 'paid_out',
    chargeDate: '2026-02-01',
    paidAt: '2026-02-04',
    failedAt: null,
    failureReason: null,
    invoiceId: 'inv_005',
    invoiceUrl: '/invoices/inv_005.pdf',
  },
  {
    id: 'pay_004',
    orgId: 'org_123',
    gcPaymentId: 'PM000004',
    amountPence: 10000,
    status: 'paid_out',
    chargeDate: '2026-01-01',
    paidAt: '2026-01-04',
    failedAt: null,
    failureReason: null,
    invoiceId: 'inv_004',
    invoiceUrl: '/invoices/inv_004.pdf',
  },
  {
    id: 'pay_003',
    orgId: 'org_123',
    gcPaymentId: 'PM000003',
    amountPence: 10000,
    status: 'paid_out',
    chargeDate: '2025-12-01',
    paidAt: '2025-12-04',
    failedAt: null,
    failureReason: null,
    invoiceId: 'inv_003',
    invoiceUrl: '/invoices/inv_003.pdf',
  },
  {
    id: 'pay_002',
    orgId: 'org_123',
    gcPaymentId: 'PM000002',
    amountPence: 10000,
    status: 'submitted',
    chargeDate: '2025-11-01',
    paidAt: null,
    failedAt: null,
    failureReason: null,
    invoiceId: null,
    invoiceUrl: null,
  },
];

const MOCK_SUMMARY: PaymentSummary = {
  outstandingAmountPence: 10000,
  nextChargeDate: '2026-04-01',
  nextChargeAmountPence: 10000,
  mandateStatus: 'active',
  orgPaymentStatus: 'payment_failed',
  lastFailedPayment: MOCK_FAILED_PAYMENT,
};

// ─── Tabs ──────────────────────────────────────────────────────────────────

type Tab = 'settings' | 'history' | 'onboarding';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'settings', label: 'Payment Settings' },
  { id: 'history', label: 'Payment History' },
  { id: 'onboarding', label: 'Onboarding' },
];

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    status: 'all',
    dateFrom: null,
    dateTo: null,
    page: 1,
    perPage: 12,
  });

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav__brand">Admin Fee — Direct Debit</span>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav__tab${activeTab === t.id ? ' nav__tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === 'settings' && (
          <PaymentSettings
            billingProfile={MOCK_BILLING_PROFILE}
            feeConfig={MOCK_FEE_CONFIG}
            isPlatformAdmin={true}
            notificationEmail="billing@acmemotors.co.uk"
            onUpdateBankDetails={async () => alert('→ Would redirect to GoCardless to update bank details')}
            onCancelMandate={async () => alert('→ Would cancel the mandate via GoCardless API')}
            onUpdateFeeConfig={async (u) => alert(`→ Would PATCH fee config: ${JSON.stringify(u)}`)}
            onUpdateNotificationEmail={async (e) => alert(`→ Would save notification email: ${e}`)}
          />
        )}

        {activeTab === 'history' && (
          <>
            <PaymentFailureBanner failedPayment={MOCK_FAILED_PAYMENT} />
            <PaymentHistoryPage
              summary={MOCK_SUMMARY}
              payments={MOCK_PAYMENTS}
              totalCount={MOCK_PAYMENTS.length}
              filters={filters}
              onFilterChange={(u) => setFilters((f) => ({ ...f, ...u }))}
              onDownloadInvoice={async (id) => alert(`→ Would download invoice ${id}`)}
              isLoading={false}
            />
          </>
        )}

        {activeTab === 'onboarding' && (
          <OnboardingDemo />
        )}
      </main>
    </div>
  );
}

// ─── Onboarding demo (cycles through screens without redirecting) ──────────

function OnboardingDemo() {
  type Screen = 'banner' | 'intro' | 'success';
  const [screen, setScreen] = useState<Screen>('banner');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['banner', 'intro', 'success'] as Screen[]).map((s) => (
          <button
            key={s}
            className={`btn ${screen === s ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setScreen(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {screen === 'banner' && (
        <MandatePendingBanner onSetupClick={() => setScreen('intro')} />
      )}

      {screen === 'intro' && (
        <DirectDebitIntro
          feeConfig={MOCK_FEE_CONFIG}
          onContinue={() => setScreen('success')}
          isLoading={false}
        />
      )}

      {screen === 'success' && (
        <DirectDebitSuccess
          bankName="Barclays"
          accountNumberEnding="4567"
          nextChargeDate="2026-04-01"
          feeAmountPence={10000}
          onContinue={() => alert('→ Would navigate to dashboard')}
        />
      )}
    </div>
  );
}
