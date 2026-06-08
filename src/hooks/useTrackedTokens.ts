// Manages the canonical verified Base token list, verified/example flags, and
// recently-fading tokens for the cooling-off state. Subscribes to realtime
// tracked_tokens changes.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';
import { EXAMPLE_TOKENS } from '../lib/sampleData';

function projectId(): string {
  try {
    // @ts-ignore
    return (window.__NULLSEC__ && window.__NULLSEC__.projectId) || 'demo';
  } catch {
    return 'demo';
  }
}
function table(): string {
  return `app_${projectId()}_tracked_tokens`;
}

export interface TrackedTokenRow {
  id: string;
  token_address: string;
  symbol: string | null;
  name: string | null;
  dex_url: string | null;
  pair_address: string | null;
  twitter_query: string | null;
  virality_score: number;
  social_score: number;
  onchain_score: number;
  engagement_velocity: number;
  verified: boolean;
  is_example: boolean;
  last_verified_at: string | null;
  updated_at: string | null;
  created_at: string;
}

function num(v: any, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalize(row: any): TrackedTokenRow {
  return {
    id: row.id,
    token_address: row.token_address,
    symbol: row.symbol ?? null,
    name: row.name ?? null,
    dex_url: row.dex_url ?? null,
    pair_address: row.pair_address ?? null,
    twitter_query: row.twitter_query ?? null,
    virality_score: num(row.virality_score),
    social_score: num(row.social_score),
    onchain_score: num(row.onchain_score),
    engagement_velocity: num(row.engagement_velocity),
    verified: !!row.verified,
    is_example: !!row.is_example,
    last_verified_at: row.last_verified_at ?? null,
    updated_at: row.updated_at ?? null,
    created_at: row.created_at,
  };
}

// Example rows from sampleData, clearly flagged is_example=true.
const EXAMPLE_ROWS: TrackedTokenRow[] = EXAMPLE_TOKENS.map((t) => ({
  id: t.id,
  token_address: t.token_address,
  symbol: t.symbol,
  name: t.name,
  dex_url: t.dex_url,
  pair_address: t.pair_address,
  twitter_query: t.twitter_query,
  virality_score: t.virality_score,
  social_score: t.social_score,
  onchain_score: t.onchain_score,
  engagement_velocity: t.engagement_velocity,
  verified: t.verified,
  is_example: true,
  last_verified_at: t.last_verified_at,
  updated_at: t.updated_at,
  created_at: t.created_at,
}));

export interface UseTrackedTokensResult {
  tokens: TrackedTokenRow[];
  liveTokens: TrackedTokenRow[];
  exampleTokens: TrackedTokenRow[];
  verifiedCount: number;
  hasLiveData: boolean;
  /** Most-watched tokens fading (for cooling-off state). */
  fadingTokens: TrackedTokenRow[];
  loading: boolean;
  error: string | null;
  isExample: boolean;
  refresh: () => Promise<void>;
}

export function useTrackedTokens(): UseTrackedTokensResult {
  const [rows, setRows] = useState<TrackedTokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLiveData, setHasLiveData] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from(table())
        .select('*')
        .order('virality_score', { ascending: false })
        .limit(200);
      if (e) throw e;
      const live = ((data as any[]) || []).map(normalize);
      const liveReal = live.filter((r) => !r.is_example);
      setHasLiveData(liveReal.length > 0);
      setRows(liveReal.length > 0 ? live : EXAMPLE_ROWS);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tracked tokens');
      setHasLiveData(false);
      setRows(EXAMPLE_ROWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsub = subscribeToTable(
      'tracked_tokens',
      (payload: any) => {
        const raw = payload.new || payload.old;
        if (!raw) return;
        const row = normalize(raw);
        setRows((prev) => {
          // first live row replaces example seed set
          const base = prev.some((r) => r.is_example) && !row.is_example ? [] : prev;
          if (payload.eventType === 'DELETE') {
            return base.filter((r) => r.id !== row.id);
          }
          const idx = base.findIndex((r) => r.id === row.id);
          let next: TrackedTokenRow[];
          if (idx === -1) next = [...base, row];
          else {
            next = [...base];
            next[idx] = { ...next[idx], ...row };
          }
          return next.sort((a, b) => b.virality_score - a.virality_score);
        });
        if (!row.is_example) setHasLiveData(true);
      },
      { event: '*' },
    );
    return unsub;
  }, []);

  const tokens = useMemo(
    () => [...rows].sort((a, b) => b.virality_score - a.virality_score),
    [rows],
  );
  const liveTokens = useMemo(() => tokens.filter((t) => !t.is_example), [tokens]);
  const exampleTokens = useMemo(() => tokens.filter((t) => t.is_example), [tokens]);
  const verifiedCount = useMemo(() => tokens.filter((t) => t.verified).length, [tokens]);

  // most-watched fading: recently updated tokens with the highest scores,
  // sorted by most recently seen so the cooling-off state shows real momentum.
  const fadingTokens = useMemo(() => {
    const pool = liveTokens.length > 0 ? liveTokens : exampleTokens;
    return [...pool]
      .sort((a, b) => {
        const ta = new Date(a.updated_at || a.created_at).getTime();
        const tb = new Date(b.updated_at || b.created_at).getTime();
        return tb - ta;
      })
      .slice(0, 3);
  }, [liveTokens, exampleTokens]);

  return {
    tokens,
    liveTokens,
    exampleTokens,
    verifiedCount,
    hasLiveData,
    fadingTokens,
    loading,
    error,
    isExample: !hasLiveData,
    refresh,
  };
}
