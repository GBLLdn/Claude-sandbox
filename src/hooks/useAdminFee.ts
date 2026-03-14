/**
 * useAdminFee
 *
 * React hook providing access to the current org's billing state.
 * Consumers can use this to gate features, show banners, etc.
 *
 * Example:
 *   const { canPurchase, failedPayment, isLoading } = useAdminFee();
 */

import { useState, useEffect } from 'react';
import type { OrgBillingProfile, AdminFeeConfig, AdminFeePayment } from '../types/admin-fee';

interface UseAdminFeeResult {
  billingProfile: OrgBillingProfile | null;
  feeConfig: AdminFeeConfig | null;
  /** True when the org can make vehicle purchases */
  canPurchase: boolean;
  /** The most recent failed payment, if any */
  failedPayment: AdminFeePayment | null;
  /** Reason purchases are blocked, or null if allowed */
  purchaseBlockReason: 'payment_failed' | 'pending_setup' | 'suspended' | null;
  isLoading: boolean;
  error: Error | null;
  /** Refresh billing state (e.g. after mandate setup) */
  refresh: () => void;
}

export function useAdminFee(orgId: string): UseAdminFeeResult {
  const [billingProfile, setBillingProfile] = useState<OrgBillingProfile | null>(null);
  const [feeConfig, setFeeConfig] = useState<AdminFeeConfig | null>(null);
  const [failedPayment, setFailedPayment] = useState<AdminFeePayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, configRes] = await Promise.all([
          fetch(`/api/orgs/${orgId}/billing-profile`),
          fetch('/api/admin-fee/config'),
        ]);

        if (!profileRes.ok || !configRes.ok) {
          throw new Error('Failed to load billing data');
        }

        const [profile, config]: [OrgBillingProfile, AdminFeeConfig] = await Promise.all([
          profileRes.json(),
          configRes.json(),
        ]);

        if (cancelled) return;
        setBillingProfile(profile);
        setFeeConfig(config);

        // Fetch most recent failed payment if applicable
        if (profile.paymentStatus === 'payment_failed') {
          const failedRes = await fetch(
            `/api/orgs/${orgId}/payments?status=failed&limit=1`
          );
          if (!failedRes.ok) throw new Error('Failed to load payment data');
          const { payments } = await failedRes.json();
          if (!cancelled) setFailedPayment(payments[0] ?? null);
        } else {
          if (!cancelled) setFailedPayment(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [orgId, refreshKey]);

  const purchaseBlockReason = getPurchaseBlockReason(billingProfile, feeConfig);
  const canPurchase = purchaseBlockReason === null;

  return {
    billingProfile,
    feeConfig,
    canPurchase,
    failedPayment,
    purchaseBlockReason,
    isLoading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}

function getPurchaseBlockReason(
  profile: OrgBillingProfile | null,
  config: AdminFeeConfig | null
): 'payment_failed' | 'pending_setup' | 'suspended' | null {
  // If fee is disabled (pilot mode), never block
  if (!config?.enabled) return null;
  if (!profile) return null;

  switch (profile.paymentStatus) {
    case 'pending_setup': return 'pending_setup';
    case 'payment_failed': return 'payment_failed';
    case 'suspended': return 'suspended';
    default: return null;
  }
}
