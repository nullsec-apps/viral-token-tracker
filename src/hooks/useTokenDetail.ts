// Full detail for one token: latest snapshot, social + onchain breakdown,
// contract metadata, and DexScreener Base verification.
import { useCallback, useEffect, useState } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';
import { findExampleToken } from '../lib/sampleData';
import { computeVirality } from '../lib/scoring';

function projectId(): string {
  try {
    // @ts-ignore
    return (window.__NULLSEC__ && window.__NULLSEC__.projectId) || 'demo';
  } catch {
    return 'demo';
  }
}
const tokensTable = () => `app_${projectId()}_tracked_tokens`;
const snapsTable = () => `app_${projectId()}_token_snapshots`;

export interface TokenDetail {
  id: string;
  token_address: string;
  symbol: string | null;
  name: string | null;
  dex_url: string | null;
  pair_address: string | null;
  twitter_query: string | null;
  verified: boolean;
  is_example: boolean;
  // latest metrics
  virality_score: number;
  social_score: number;
  onchain_score: number;
  engagement_velocity: number;
  mention_count_1h: number;
  mention_change_pct: number;
  volume_spike_pct: number;
  new_holders_1h: number;
  tx_count_1h: number;
  holder_count: number;
  volume_24h: number;
  liquidity_usd: number;
  market_cap: number;
  fdv: number;
  volume_to_market_cap: number;
  price_usd: number;
  last_verified_at: string | null;
  updated_at: string | null;
}

export interface DexVerification {
  verified: boolean;
  chainId?: string;
  pairAddress?: string;
  dexUrl?: string;
  warning?: string;
}

export interface UseTokenDetailResult {
  token: TokenDetail | null;
  loading: boolean;
  error: string | null;
  isExample: boolean;
  verification: DexVerification | null;
  refresh: () => Promise<void>;
}

function num(v: any, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function fromExample(address: string): TokenDetail | null {
  const ex = findExampleToken(address);
  if (!ex) return null;
  return {
    id: ex.id,
    token_address: ex.token_address,
    symbol: ex.symbol,
    name: ex.name,
    dex_url: ex.dex_url,
    pair_address: ex.pair_address,
    twitter_query: ex.twitter_query,
    verified: ex.verified,
    is_example: true,
    virality_score: ex.virality_score,
    social_score: ex.social_score,
    onchain_score: ex.onchain_score,
    engagement_velocity: ex.engagement_velocity,
    mention_count_1h: ex.mention_count_1h,
    mention_change_pct: ex.mention_change_pct,
    volume_spike_pct: ex.volume_spike_pct,
    new_holders_1h: ex.new_holders_1h,
    tx_count_1h: ex.tx_count_1h,
    holder_count: ex.holder_count,
    volume_24h: ex.volume_24h,
    liquidity_usd: ex.liquidity_usd,
    market_cap: ex.market_cap,
    fdv: ex.fdv,
    volume_to_market_cap: ex.volume_to_market_cap,
    price_usd: ex.price_usd,
    last_verified_at: ex.last_verified_at,
    updated_at: ex.updated_at,
  };
}

export function useTokenDetail(
  addressOrId: string | null | undefined,
): UseTokenDetailResult {
  const [token, setToken] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExample, setIsExample] = useState(false);
  const [verification, setVerification] = useState<DexVerification | null>(null);

  const load = useCallback(async () => {
    if (!addressOrId) {
      setToken(null);
      setIsExample(false);
      setVerification(null);
      return;
    }
    setLoading(true);
    setError(null);
    const key = addressOrId;
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(key);
    try {
      let q = supabase.from(tokensTable()).select('*').limit(1);
      q = isAddress ? q.eq('token_address', key.toLowerCase()) : q.eq('id', key);
      const { data: tokens, error: te } = await q;
      if (te) throw te;
      const tRow: any = tokens && tokens[0];

      if (tRow && !tRow.is_example) {
        // pull latest snapshot for full metric breakdown
        const { data: snaps } = await supabase
          .from(snapsTable())
          .select('*')
          .eq('token_address', String(tRow.token_address).toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);
        const s: any = snaps && snaps[0];
        const detail: TokenDetail = {
          id: tRow.id,
          token_address: tRow.token_address,
          symbol: tRow.symbol,
          name: tRow.name,
          dex_url: tRow.dex_url ?? s?.dex_url ?? null,
          pair_address: tRow.pair_address ?? null,
          twitter_query: tRow.twitter_query ?? null,
          verified: !!tRow.verified,
          is_example: false,
          virality_score: num(tRow.virality_score ?? s?.virality_score),
          social_score: num(tRow.social_score ?? s?.social_score),
          onchain_score: num(tRow.onchain_score ?? s?.onchain_score),
          engagement_velocity: num(tRow.engagement_velocity ?? s?.engagement_velocity),
          mention_count_1h: num(s?.mention_count_1h),
          mention_change_pct: num(s?.mention_change_pct),
          volume_spike_pct: num(s?.volume_spike_pct),
          new_holders_1h: num(s?.new_holders_1h),
          tx_count_1h: num(s?.tx_count_1h),
          holder_count: num(s?.holder_count),
          volume_24h: num(s?.volume_24h),
          liquidity_usd: num(s?.liquidity_usd),
          market_cap: num(s?.market_cap),
          fdv: num(s?.fdv),
          volume_to_market_cap: num(s?.volume_to_market_cap),
          price_usd: num(s?.price_usd),
          last_verified_at: tRow.last_verified_at ?? null,
          updated_at: tRow.updated_at ?? null,
        };
        setToken(detail);
        setIsExample(false);
        if (isAddress) verifyOnDex(detail.token_address).then(setVerification).catch(() => {});
      } else {
        const ex = fromExample(key);
        if (ex) {
          setToken(ex);
          setIsExample(true);
          setVerification({
            verified: true,
            chainId: 'base',
            pairAddress: ex.pair_address || undefined,
            dexUrl: ex.dex_url || undefined,
            warning: 'Example token — placeholder metrics shown until live data arrives.',
          });
        } else {
          setToken(null);
          setIsExample(false);
          setError('Token not found.');
        }
      }
    } catch (err: any) {
      const ex = fromExample(key);
      if (ex) {
        setToken(ex);
        setIsExample(true);
      } else {
        setError(err?.message || 'Failed to load token detail');
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [addressOrId]);

  useEffect(() => {
    load();
  }, [load]);

  // live update on tracked_tokens changes for this token
  useEffect(() => {
    if (!addressOrId) return;
    const key = addressOrId;
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(key);
    const unsub = subscribeToTable(
      'tracked_tokens',
      (payload: any) => {
        const row = (payload.new || payload.old) as any;
        if (!row) return;
        const matches = isAddress
          ? (row.token_address || '').toLowerCase() === key.toLowerCase()
          : row.id === key;
        if (!matches) return;
        setToken((prev) =>
          prev
            ? {
                ...prev,
                virality_score: num(row.virality_score, prev.virality_score),
                social_score: num(row.social_score, prev.social_score),
                onchain_score: num(row.onchain_score, prev.onchain_score),
                engagement_velocity: num(row.engagement_velocity, prev.engagement_velocity),
                updated_at: row.updated_at ?? prev.updated_at,
              }
            : prev,
        );
      },
      { event: '*' },
    );
    return unsub;
  }, [addressOrId]);

  return { token, loading, error, isExample, verification, refresh: load };
}

/** Verify a token address against DexScreener (Base chain only) via fetch-url proxy. */
async function verifyOnDex(address: string): Promise<DexVerification> {
  try {
    // @ts-ignore
    const appId = (window.__NULLSEC__ && window.__NULLSEC__.projectId) || 'demo';
    const res = await fetch('https://api.nullsec.studio/fetch-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId,
        url: `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      }),
    });
    if (!res.ok) return { verified: false, warning: 'Verification unavailable' };
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      const inner = JSON.parse(text)?.body ?? text;
      json = typeof inner === 'string' ? JSON.parse(inner) : inner;
    }
    const pairs: any[] = json?.pairs || json?.body?.pairs || [];
    const basePair = pairs.find((p) => p?.chainId === 'base');
    if (basePair) {
      return {
        verified: true,
        chainId: 'base',
        pairAddress: basePair.pairAddress,
        dexUrl: basePair.url || `https://dexscreener.com/base/${address}`,
      };
    }
    return {
      verified: false,
      warning: pairs.length
        ? 'Token found but not on Base — filtered out.'
        : 'No DexScreener pair found.',
    };
  } catch {
    return { verified: false, warning: 'Verification request failed' };
  }
}

/** Recompute virality from a detail object using current weights (helper). */
export function recomputeViralityFromDetail(d: TokenDetail, socialWeight = 0.5) {
  return computeVirality(
    {
      mention_count_1h: d.mention_count_1h,
      mention_change_pct: d.mention_change_pct,
      engagement_velocity: d.engagement_velocity,
    },
    {
      volume_spike_pct: d.volume_spike_pct,
      volume_24h: d.volume_24h,
      new_holders_1h: d.new_holders_1h,
      tx_count_1h: d.tx_count_1h,
      liquidity_usd: d.liquidity_usd,
      volume_to_market_cap: d.volume_to_market_cap,
    },
    { social: socialWeight, onchain: 1 - socialWeight },
  );
}
