// Computes aggregate market-wide social velocity (mentions/hr) across tracked
// tokens for the radial gauge and cooling-off state. Pulls the most recent
// snapshot per token from app_{projectId}_token_snapshots.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';
import { exampleMarketVelocity } from '../lib/sampleData';
import { clamp } from '../lib/formatMetrics';

function projectId(): string {
  try {
    // @ts-ignore
    return (window.__NULLSEC__ && window.__NULLSEC__.projectId) || 'demo';
  } catch {
    return 'demo';
  }
}
function snapsTable(): string {
  return `app_${projectId()}_token_snapshots`;
}

export interface MarketVelocity {
  /** Aggregate mentions/hr across tracked tokens. */
  mentionsPerHour: number;
  /** Aggregate engagement velocity. */
  engagementVelocity: number;
  /** Distinct tokens contributing. */
  tokenCount: number;
  /** Average virality across the latest snapshots (0..100). */
  avgVirality: number;
  /** 0..100 gauge fill value derived from mentions/hr on a log curve. */
  gaugeValue: number;
}

export interface UseMarketVelocityGaugeResult {
  velocity: MarketVelocity;
  loading: boolean;
  error: string | null;
  isExample: boolean;
  refresh: () => Promise<void>;
}

function num(v: any, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

// Map aggregate mentions/hr to a 0..100 gauge fill on a soft log curve so small
// values still register and large values asymptote.
function gaugeFromMentions(mentionsPerHour: number): number {
  const m = Math.max(0, mentionsPerHour);
  // log10(50001)/4.7 ~= 1 at ~50k mentions/hr
  const norm = Math.log10(m + 1) / 4.7;
  return Number(clamp(norm * 100, 0, 100).toFixed(1));
}

export function useMarketVelocityGauge(): UseMarketVelocityGaugeResult {
  const ex = useMemo(() => exampleMarketVelocity(), []);
  const [velocity, setVelocity] = useState<MarketVelocity>(() => ({
    mentionsPerHour: ex.mentionsPerHour,
    engagementVelocity: ex.engagementVelocity,
    tokenCount: ex.tokenCount,
    avgVirality: 0,
    gaugeValue: gaugeFromMentions(ex.mentionsPerHour),
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExample, setIsExample] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data, error: e } = await supabase
        .from(snapsTable())
        .select('token_address, mention_count_1h, engagement_velocity, virality_score, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (e) throw e;
      const rows = (data as any[]) || [];
      if (rows.length === 0) {
        setVelocity({
          mentionsPerHour: ex.mentionsPerHour,
          engagementVelocity: ex.engagementVelocity,
          tokenCount: ex.tokenCount,
          avgVirality: 0,
          gaugeValue: gaugeFromMentions(ex.mentionsPerHour),
        });
        setIsExample(true);
        return;
      }
      // keep latest snapshot per token
      const latest = new Map<string, any>();
      for (const r of rows) {
        const key = (r.token_address || '').toLowerCase();
        if (!latest.has(key)) latest.set(key, r);
      }
      let mentions = 0;
      let engagement = 0;
      let viralitySum = 0;
      latest.forEach((r) => {
        mentions += num(r.mention_count_1h);
        engagement += num(r.engagement_velocity);
        viralitySum += num(r.virality_score);
      });
      const tokenCount = latest.size;
      setVelocity({
        mentionsPerHour: Math.round(mentions),
        engagementVelocity: Number(engagement.toFixed(1)),
        tokenCount,
        avgVirality: tokenCount ? Number((viralitySum / tokenCount).toFixed(1)) : 0,
        gaugeValue: gaugeFromMentions(mentions),
      });
      setIsExample(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load market velocity');
      setVelocity({
        mentionsPerHour: ex.mentionsPerHour,
        engagementVelocity: ex.engagementVelocity,
        tokenCount: ex.tokenCount,
        avgVirality: 0,
        gaugeValue: gaugeFromMentions(ex.mentionsPerHour),
      });
      setIsExample(true);
    } finally {
      setLoading(false);
    }
  }, [ex]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // recompute on new snapshots
  useEffect(() => {
    const unsub = subscribeToTable(
      'token_snapshots',
      () => {
        refresh();
      },
      { event: 'INSERT' },
    );
    return unsub;
  }, [refresh]);

  return { velocity, loading, error, isExample, refresh };
}
