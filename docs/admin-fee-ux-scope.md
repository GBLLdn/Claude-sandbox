# Admin Fee — UX Scope

**Status:** Scoping / Pre-pilot
**Feature:** Monthly admin fee charged via GoCardless Direct Debit
**Audience:** Org managers, branch managers, dealers

---

## 1. Overview

Every dealer organisation pays a monthly admin fee (default **£100**) in exchange
for access to the platform. The fee is charged automatically via a GoCardless
Direct Debit mandate. No vehicle purchase can be completed until a valid mandate
is in place.

For **pilot**: the fee feature is built but the toggle is **OFF** — no charges
are made. This lets us validate the flow end-to-end before flipping it live.

---

## 2. Constraints & Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Direct Debit via GoCardless | Lower friction than card, standard for B2B SaaS in UK |
| 2 | Mandate must exist before first purchase | Enforces payment model without surprises |
| 3 | Org/branch manager sets up mandate (not individual dealers) | Single billing entity per organisation |
| 4 | Fee is fixed at £100/month; variable in future | Platform-configurable toggle, per-org override possible later |
| 5 | Payment trigger is outside the core purchase flow | Avoids coupling; monthly cron / GoCardless webhook |
| 6 | Payment history separate from vehicle order history | Distinct concerns; different audiences |
| 7 | Failures block new purchases; surfaced prominently | Protects platform revenue; clear resolution path |

---

## 3. GoCardless Integration Points

```
Registration  →  GoCardless Billing Request  →  Mandate created  →  Stored on Org
Monthly cron  →  GoCardless Payment create   →  Webhook confirms  →  Invoice generated
Failure       →  GoCardless webhook           →  Notify org admin  →  Block purchases
```

Key GoCardless entities used:
- **Billing Request** — collects bank details (hosted flow or embedded)
- **Mandate** — the authorisation to debit the account
- **Payment** — each monthly charge against the mandate
- **Webhook events** — `payment_paid_out`, `payment_failed`, `mandate_cancelled`

---

## 4. User Flows

### 4.1 Onboarding — Direct Debit Setup

```
New org registers
       │
       ▼
Account created (limited access)
       │
       ▼
[Mandatory] Set up Direct Debit
  ├─ Intro screen: why we need it, what will be charged, when
  ├─ GoCardless hosted flow (redirect) OR embedded widget
  │    └─ Bank details → confirmation → mandate reference returned
  └─ Success: mandate stored on org record
       │
       ▼
Full platform access unlocked
       │
       ▼
First vehicle purchase permitted ✓
```

**Edge cases:**
- User closes tab mid-flow → incomplete mandate banner on every page until resolved
- GoCardless errors → surfaced inline with retry option
- Existing mandate cancelled externally → webhook triggers re-setup prompt

---

### 4.2 Monthly Payment Cycle

```
1st of month (or configured date)
       │
       ▼
Platform creates GoCardless Payment against mandate
       │
       ├─ Success path
       │    └─ Webhook: payment_paid_out
       │         └─ Generate invoice PDF → attach to payment record
       │
       └─ Failure path
            └─ Webhook: payment_failed
                 ├─ Mark org: payment_failed = true
                 ├─ Block new vehicle purchases
                 ├─ Email org admin + in-app banner
                 └─ Retry window: 3 days → if still failed → manual resolution
```

---

### 4.3 Payment Failure Resolution

```
Org admin sees failure banner
       │
       ├─ Option A: Retry payment (if mandate still valid)
       │
       └─ Option B: Update bank details (new GoCardless billing request)
              └─ New mandate replaces old → retry payment
```

---

## 5. Screen Inventory

### Screen 1 — Onboarding: Direct Debit Gate

**Route:** `/onboarding/payment-setup`
**Trigger:** Post-registration, before platform access

| Element | Detail |
|---------|--------|
| Progress indicator | Step X of Y in onboarding |
| Explainer copy | What is a Direct Debit, what amount, when charged |
| Fee display | "£100 / month" (dynamic from platform config) |
| CTA | "Set up Direct Debit" → GoCardless flow |
| Trust signals | GoCardless logo, DD guarantee badge |
| Skip / defer | Not available — mandatory before purchases |

---

### Screen 2 — Mandate Success Confirmation

**Route:** `/onboarding/payment-setup/success` (or GoCardless return URL)

| Element | Detail |
|---------|--------|
| Success state | Mandate reference, account ending in XXXX |
| Next step | "Continue to dashboard" |
| What happens next | Summary: first charge date, invoice delivery |

---

### Screen 3 — Payment Settings

**Route:** `/settings/payments`
**Access:** Org admin / branch manager only

| Element | Detail |
|---------|--------|
| Current mandate | Bank name, account ending, mandate status |
| Update bank details | Triggers new GoCardless billing request |
| Cancel mandate | Warning modal, consequences explained |
| Admin fee toggle | Platform admin only — on/off switch for billing |
| Fee amount display | "£100 / month" with next charge date |
| Notification preferences | Email address for payment notifications |

---

### Screen 4 — Payment History & Invoices

**Route:** `/payments`
**Access:** Org admin / branch manager

| Element | Detail |
|---------|--------|
| Summary bar | Outstanding balance, next charge date, mandate status |
| Payments table | Date, amount, status (paid / failed / pending), invoice link |
| Status chips | Colour-coded: green paid, red failed, amber pending |
| Invoice download | PDF per payment |
| Pagination | 12 per page, date range filter |
| Empty state | "No payments yet — first charge on [date]" |

---

### Screen 5 — Payment Failure Banner (persistent)

**Shown on:** All pages when `org.paymentStatus === 'failed'`

| Element | Detail |
|---------|--------|
| Type | Destructive banner, top of page |
| Copy | "Your last payment of £100 failed on [date]. New vehicle purchases are paused." |
| CTA | "Resolve now" → `/settings/payments` |
| Dismissible | No — persists until resolved |

---

### Screen 6 — Purchase Blocker

**Shown on:** Vehicle purchase CTA when payment failed

| Element | Detail |
|---------|--------|
| Inline error | "Purchases are paused due to a payment issue" |
| CTA | "Go to payment settings" |

---

### Screen 7 — Platform Admin: Fee Configuration

**Route:** `/admin/billing-config`
**Access:** Internal platform admin only

| Element | Detail |
|---------|--------|
| Global admin fee toggle | On / Off |
| Default fee amount | Editable (£) |
| Per-org overrides | Table: org name, custom fee, toggle |
| Effective date | When next charge will reflect changes |

---

## 6. Component Map

```
AdminFeeGate              — HOC wrapping purchase flow; blocks if no mandate / payment failed
DirectDebitSetupWizard    — Onboarding steps + GoCardless embed
MandateStatusCard         — Current mandate info on settings page
PaymentHistoryTable       — Sortable/filterable payments list
InvoiceDownloadButton     — Fetches & downloads PDF
PaymentFailureBanner      — Persistent global failure state
FeeConfigPanel            — Admin toggle + amount setting
PaymentSummaryBar         — Balance / next date / status widget
```

---

## 7. Data Model (summary)

See `src/types/admin-fee.ts` for full TypeScript definitions.

```
Organisation
  └─ mandate: GoCardlessMandateRef | null
  └─ paymentStatus: 'active' | 'failed' | 'pending_setup' | 'suspended'
  └─ adminFeeEnabled: boolean (platform-level)
  └─ adminFeeAmount: number (pence)

Payment
  └─ id, orgId, amount, status, chargeDate, invoiceUrl, gcPaymentId

AdminFeeConfig (platform-level)
  └─ enabled: boolean
  └─ defaultAmountPence: number
  └─ billingDayOfMonth: number
  └─ perOrgOverrides: OrgFeeOverride[]
```

---

## 8. States & Status Matrix

| Mandate | Payment | Purchase allowed? | Banner shown? |
|---------|---------|-------------------|---------------|
| None | — | ✗ | Setup prompt |
| Active | Active/paid | ✓ | — |
| Active | Failed | ✗ | Payment failure |
| Active | Pending | ✓ | — |
| Cancelled | — | ✗ | Setup prompt |

---

## 9. Open Questions

1. **Retry policy** — how many GoCardless retries before manual escalation?
2. **Proration** — is the first charge pro-rated if onboarded mid-month?
3. **Invoice format** — what fields are legally required on the PDF?
4. **Multi-branch** — does each branch have its own mandate or one per org?
5. **Grace period** — is there a window after failure before purchases are blocked?
6. **Admin side** — is GoCardless dashboard sufficient or do we need internal tooling?
7. **Email provider** — what handles failure notification emails?
8. **Fee toggle UX** — should dealers see "billing paused" or nothing when admin fee is off?

---

## 10. Out of Scope (for this phase)

- Variable fee based on transaction volume
- Per-vehicle fee (as opposed to monthly subscription)
- Credit terms / invoicing without DD
- Xero / accounting system integration (future)
- Automated dunning beyond 3-day retry window
