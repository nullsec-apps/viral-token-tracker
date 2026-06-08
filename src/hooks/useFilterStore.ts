// Filter store for the left-rail signal filters. Base-locked is always on.
// Social/onchain weight balance feeds the fused virality recompute.
// Uses an inlined zustand-compatible shim (no extra dependency).
import { create } from '../lib/zustandShim';
import type { ScoreWeights } from '../lib/scoring';

export type SortMode = 'virality' | 'engagement' | 'volume_spike' | 'new_holders';

export interface FilterState {
  /** Base chain is always locked on — analytics only show verified Base tokens. */
  baseLocked: true;
  /** Minimum fused virality score (0..100). */
  viralityThreshold: number;
  /** 0..1 — share of the score that comes from social signals (magenta). */
  socialWeight: number;
  /** Minimum liquidity in USD. */
  minLiquidity: number;
  /** Only show DexScreener-verified Base tokens (hides example rows). */
  verifiedOnly: boolean;
  /** Sort mode for the leaderboard stream. */
  sortMode: SortMode;

  setViralityThreshold: (n: number) => void;
  setSocialWeight: (n: number) => void;
  setMinLiquidity: (n: number) => void;
  setVerifiedOnly: (v: boolean) => void;
  setSortMode: (m: SortMode) => void;
  reset: () => void;
}

const DEFAULTS = {
  viralityThreshold: 30,
  socialWeight: 0.5,
  minLiquidity: 0,
  verifiedOnly: false,
  sortMode: 'virality' as SortMode,
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export const useFilterStore = create<FilterState>((set) => ({
  baseLocked: true,
  ...DEFAULTS,

  setViralityThreshold: (n) =>
    set({ viralityThreshold: Math.min(100, Math.max(0, Math.round(n))) }),
  setSocialWeight: (n) => set({ socialWeight: clamp01(n) }),
  setMinLiquidity: (n) => set({ minLiquidity: Math.max(0, n) }),
  setVerifiedOnly: (v) => set({ verifiedOnly: v }),
  setSortMode: (m) => set({ sortMode: m }),
  reset: () => set({ baseLocked: true, ...DEFAULTS }),
}));

/** Derive normalized ScoreWeights from the store's socialWeight. */
export function weightsFromStore(socialWeight: number): ScoreWeights {
  const s = clamp01(socialWeight);
  return { social: s, onchain: 1 - s };
}

/** Selector hook returning the score weights derived from the filter store. */
export function useScoreWeights(): ScoreWeights {
  const socialWeight = useFilterStore((s) => s.socialWeight);
  return weightsFromStore(socialWeight);
}
