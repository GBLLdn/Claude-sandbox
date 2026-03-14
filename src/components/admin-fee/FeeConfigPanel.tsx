/**
 * FeeConfigPanel — Platform admin only
 *
 * Toggle the admin fee on/off globally, set the default amount,
 * and manage per-org overrides.
 */

import React, { useState } from 'react';
import type { AdminFeeConfig, OrgFeeOverride } from '../../types/admin-fee';
import { formatPence } from '../../lib/format';

interface FeeConfigPanelProps {
  config: AdminFeeConfig;
  onUpdate: (updated: Partial<AdminFeeConfig>) => Promise<void>;
}

export function FeeConfigPanel({ config, onUpdate }: FeeConfigPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [amountInput, setAmountInput] = useState(
    String(config.defaultAmountPence / 100)
  );
  const [billingDay, setBillingDay] = useState(String(config.billingDayOfMonth));

  async function handleToggle() {
    setIsSaving(true);
    await onUpdate({ enabled: !config.enabled });
    setIsSaving(false);
  }

  async function handleAmountSave(e: React.FormEvent) {
    e.preventDefault();
    const pence = Math.round(parseFloat(amountInput) * 100);
    if (isNaN(pence) || pence <= 0) return;
    setIsSaving(true);
    await onUpdate({ defaultAmountPence: pence });
    setIsSaving(false);
  }

  async function handleBillingDaySave(e: React.FormEvent) {
    e.preventDefault();
    const day = parseInt(billingDay, 10);
    if (isNaN(day) || day < 1 || day > 28) return;
    setIsSaving(true);
    await onUpdate({ billingDayOfMonth: day });
    setIsSaving(false);
  }

  return (
    <div className="fee-config">
      {/* Master toggle */}
      <div className="fee-config__toggle-row">
        <div className="fee-config__toggle-label">
          <span className="fee-config__toggle-title">Admin fee billing</span>
          <span className="fee-config__toggle-hint">
            {config.enabled
              ? 'Organisations are being charged the admin fee.'
              : 'Admin fee is OFF — no charges will be made (pilot mode).'}
          </span>
        </div>
        <button
          className={`toggle ${config.enabled ? 'toggle--on' : 'toggle--off'}`}
          onClick={handleToggle}
          disabled={isSaving}
          aria-pressed={config.enabled}
          aria-label="Toggle admin fee billing"
        >
          <span className="toggle__knob" />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Default amount */}
          <form className="fee-config__form" onSubmit={handleAmountSave}>
            <div className="form__field">
              <label className="form__label" htmlFor="default-amount">
                Default monthly fee (£)
              </label>
              <div className="form__input-group">
                <span className="form__input-prefix">£</span>
                <input
                  id="default-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  className="form__input"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn--secondary" disabled={isSaving}>
              Update amount
            </button>
          </form>

          {/* Billing day */}
          <form className="fee-config__form" onSubmit={handleBillingDaySave}>
            <div className="form__field">
              <label className="form__label" htmlFor="billing-day">
                Billing day of month (1–28)
              </label>
              <input
                id="billing-day"
                type="number"
                min="1"
                max="28"
                className="form__input fee-config__day-input"
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--secondary" disabled={isSaving}>
              Update billing day
            </button>
          </form>

          {/* Per-org overrides */}
          <div className="fee-config__overrides">
            <h3 className="fee-config__overrides-title">Per-organisation overrides</h3>
            <OrgOverridesTable overrides={config.perOrgOverrides} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Per-org overrides table ───────────────────────────────────────────────

function OrgOverridesTable({ overrides }: { overrides: OrgFeeOverride[] }) {
  if (overrides.length === 0) {
    return (
      <p className="empty-state__body">
        No per-organisation overrides configured. All organisations use the
        default fee.
      </p>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Organisation</th>
          <th>Custom fee</th>
          <th>Exempt</th>
        </tr>
      </thead>
      <tbody>
        {overrides.map((o) => (
          <tr key={o.orgId}>
            <td>{o.orgName}</td>
            <td>
              {o.customAmountPence !== null
                ? formatPence(o.customAmountPence)
                : <span className="text-muted">Default</span>}
            </td>
            <td>
              {o.exempt
                ? <span className="badge badge--warning">Exempt</span>
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
