// Time-series snapshots for sparklines + TrendChart. Appends on INSERT realtime.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';
import { findExampleToken, exampleSnapshotsFor } from '../lib/sampleData';

function projectId(): string {
  try {
    // @ts-ignore
    return (window.__NULLSEC__ && window.__NULLSEC__.projectId) || 'demo';
  } catch {
    return 'demo';
  }
}
function table(): string {
  return `app_${projectId()}_token_snapshots`;
}

export type SnapshotRange = '1h' | '6h' | '24h' | '7d';

export interface SnapshotRow {
  id?: string;
  token_id: string;
  token_address: string;
  market_cap?: number | null;
  fdv?: number | null;
  volume_24h?: number | null;
  volume_to_market_cap?: number | null;
  liquidity_usd?: number | null;
  price_usd?: number | null;
  dex_url?: string | null;
  holder_count?: number | null;
  new_holders_1h?: number | null;
  tx_count_1h?: number | null;
  volume_spike_pct?: number | null;
  mention_count_1h?: number | null;
  mention_change_pct?: number | null;
  engagement_velocity?: number | null;
  social_score?: number | null;
  onchain_score?: number | null;
  virality_score?: number | null;
  raw?: Record<string, unknown> | null;
  created_at: string;
}

const RANGE_MS: Record<SnapshotRange, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

export interface UseTokenSnapshotsResult {
  snapshots: SnapshotRow[];
  sparkline: number[];
  loading: boolean;
  error: string | null;
  isExample: boolean;
  refresh: () => Promise<void>;
}

/**
 * Fetch snapshots for a token by id or address, filtered to a time range.
 * Falls back to clearly-labeled example data when no live rows exist.
 */
export function useTokenSnapshots(
  tokenIdOrAddress: string | null | undefined,
  range: SnapshotRange = '1h',
): UseTokenSnapshotsResult {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExample, setIsExample] = useState(false);

  const sinceIso = useMemo(
    () => new Date(Date.now() - RANGE_MS[range]).toISOString(),
    [range],
  );

  const refresh = useCallback(async () => {
    if (!tokenIdOrAddress) {
      setSnapshots([]);
      setIsExample(false);
      return;
    }
    setLoading(true);
    setError(null);
    const key = tokenIdOrAddress;
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(key);
    try {
      let query = supabase
        .from(table())
        .select('*')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: true })
        .limit(2000);
      query = isAddress
        ? query.eq('token_address', key.toLowerCase())
        : query.eq('token_id', key);
      const { data, error: e } = await query;
      if (e) throw e;
      const rows = (data as SnapshotRow[]) || [];
      if (rows.length > 0) {
        setSnapshots(rows);
        setIsExample(false);
      } else {
        // fall back to example series so charts/sparklines render
        const ex = findExampleToken(key);
        if (ex) {
          const points = range === '1h' ? 60 : range === '6h' ? 72 : range === '24h' ? 96 : 168;
          setSnapshots(
            exampleSnapshotsFor(ex, points).map((s) => ({
              token_id: ex.id,
              token_address: ex.token_address,
              market_cap: ex.market_cap,
              fdv: ex.fdv,
              liquidity_usd: s.liquidity_usd,
              volume_24h: s.volume_24h,
              price_usd: s.price_usd,
              holder_count: ex.holder_count,
              new_holders_1h: s.new_holders_1h,
              tx_count_1h: s.tx_count_1h,
              volume_spike_pct: s.volume_spike_pct,
              mention_count_1h: s.mention_count_1h,
              mention_change_pct: ex.mention_change_pct,
              engagement_velocity: s.engagement_velocity,
              social_score: s.social_score,
              onchain_score: s.onchain_score,
              virality_score: s.virality_score,
              created_at: s.created_at,
            })),
          );
          setIsExample(true);
        } else {
          setSnapshots([]);
          setIsExample(false);
        }
      }
    } catch (err: any) {
      // graceful fallback to example data on error
      const ex = findExampleToken(key);
      if (ex) {
        const points = range === '1h' ? 60 : 96;
        setSnapshots(
          exampleSnapshotsFor(ex, points).map((s) => ({
            token_id: ex.id,
            token_address: ex.token_address,
            virality_score: s.virality_score,
            social_score: s.social_score,
            onchain_score: s.onchain_score,
            mention_count_1h: s.mention_count_1h,
            engagement_velocity: s.engagement_velocity,
            volume_spike_pct: s.volume_spike_pct,
            new_holders_1h: s.new_holders_1h,
            tx_count_1h: s.tx_count_1h,
            volume_24h: s.volume_24h,
            liquidity_usd: s.liquidity_usd,
            price_usd: s.price_usd,
            created_at: s.created_at,
          })),
        );
        setIsExample(true);
      } else {
        setError(err?.message || 'Failed to load snapshots');
        setSnapshots([]);
      }
    } finally {
      setLoading(false);
    }
  }, [tokenIdOrAddress, sinceIso, range]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // append on INSERT realtime
  useEffect(() => {
    if (!tokenIdOrAddress) return;
    const key = tokenIdOrAddress;
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(key);
    const unsub = subscribeToTable(
      'token_snapshots',
      (payload: any) => {
        const row = payload.new as SnapshotRow;
        if (!row) return;
        const matches = isAddress
          ? (row.token_address || '').toLowerCase() === key.toLowerCase()
          : row.token_id === key;
        if (!matches) return;
        setIsExample(false);
        setSnapshots((prev) => {
          if (prev.some((s) => s.id && s.id === row.id)) return prev;
          const next = [...prev.filter((s) => !( s as any).__ex), row];
          // keep within range window
          const cutoff = Date.now() - RANGE_MS[range];
          return next.filter((s) => new Date(s.created_at).getTime() >= cutoff).slice(-2000);
        });
      },
      { event: 'INSERT' },
    );
    return unsub;
  }, [tokenIdOrAddress, range]);

  const sparkline = useMemo(
    () =>
      snapshots
        .map((s) => Number(s.virality_score ?? 0))
        .filter((n) => Number.isFinite(n)),
    [snapshots],
  );

  return { snapshots, sparkline, loading, error, isExample, refresh };
}
