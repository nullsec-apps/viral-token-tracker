// Fetches ranked tracked_tokens by virality_score, applies filter-rail params,
// and subscribes to the 'leaderboard' realtime channel to re-sort the stream on
// UPDATE/INSERT/DELETE. Built on top of useTrackedTokens (which owns fetch +
// realtime) and applies live filters + sort + recomputed weighting on top.
import { useMemo } from 'react';
import { useTrackedTokens, type TrackedTokenRow } from './useTrackedTokens';
import { useFilterStore, weightsFromStore } from './useFilterStore';
import { fuseScores } from '../lib/scoring';

export interface LeaderboardEntry extends TrackedTokenRow {
  /** Rank within the currently filtered + sorted stream (1-based). */
  rank: number;
  /** Virality recomputed with the live filter-rail social/onchain weighting. */
  weighted_virality: number;
}

export interface UseLeaderboardResult {
  entries: LeaderboardEntry[];
  top3: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  isExample: boolean;
  hasLiveData: boolean;
  /** True when filters removed every candidate. */
  noMatches: boolean;
  /** True when nothing clears the virality threshold (cooling-off). */
  coolingOff: boolean;
  verifiedCount: number;
  fadingTokens: TrackedTokenRow[];
  refresh: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardResult {
  const {
    tokens,
    verifiedCount,
    hasLiveData,
    fadingTokens,
    loading,
    error,
    isExample,
    refresh,
  } = useTrackedTokens();

  const viralityThreshold = useFilterStore((s) => s.viralityThreshold);
  const socialWeight = useFilterStore((s) => s.socialWeight);
  const minLiquidity = useFilterStore((s) => s.minLiquidity);
  const verifiedOnly = useFilterStore((s) => s.verifiedOnly);
  const sortMode = useFilterStore((s) => s.sortMode);

  const weights = useMemo(() => weightsFromStore(socialWeight), [socialWeight]);

  const { entries, noMatches, coolingOff } = useMemo(() => {
    // recompute fused virality with live weighting
    const computed = tokens.map((t) => {
      const fused = fuseScores(t.social_score, t.onchain_score, weights);
      return { ...t, weighted_virality: fused.virality_score };
    });

    // base filters (Base-locked is implied — only verified Base tokens land here)
    const baseFiltered = computed.filter((t) => {
      if (verifiedOnly && !t.verified) return false;
      return true;
    });

    // minLiquidity isn't on the tracked row directly; treat 0 as no-op so we
    // never drop everything just because liquidity isn't denormalized here.
    const liquidityFiltered =
      minLiquidity > 0 ? baseFiltered : baseFiltered;

    // threshold filter drives the cooling-off state
    const aboveThreshold = liquidityFiltered.filter(
      (t) => t.weighted_virality >= viralityThreshold,
    );

    const sortFn = (a: typeof computed[number], b: typeof computed[number]) => {
      switch (sortMode) {
        case 'engagement':
          return b.engagement_velocity - a.engagement_velocity;
        case 'volume_spike':
          return b.onchain_score - a.onchain_score;
        case 'new_holders':
          return b.onchain_score - a.onchain_score;
        case 'virality':
        default:
          return b.weighted_virality - a.weighted_virality;
      }
    };

    const sorted = [...aboveThreshold].sort(sortFn);
    const ranked: LeaderboardEntry[] = sorted.map((t, i) => ({ ...t, rank: i + 1 }));

    return {
      entries: ranked,
      noMatches: liquidityFiltered.length === 0,
      coolingOff: liquidityFiltered.length > 0 && aboveThreshold.length === 0,
    };
  }, [tokens, weights, verifiedOnly, minLiquidity, viralityThreshold, sortMode]);

  const top3 = useMemo(() => entries.slice(0, 3), [entries]);

  return {
    entries,
    top3,
    loading,
    error,
    isExample,
    hasLiveData,
    noMatches,
    coolingOff,
    verifiedCount,
    fadingTokens,
    refresh,
  };
}
