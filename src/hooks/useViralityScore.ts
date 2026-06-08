// Derives/recomputes the fused virality score from social_score + onchain_score
// using current filter-rail weights; exposes a pulse profile tied to live
// engagement velocity so the Virality Pulse ring beats faster as hype spikes.
import { useMemo } from 'react';
import { fuseScores, viralityTier, type ViralityResult } from '../lib/scoring';
import { useScoreWeights } from './useFilterStore';
import { pulseFromVelocity, ringGradient, fusedColor, type PulseProfile, type RingGradient } from '../lib/pulseMath';

export interface ViralityScoreInput {
  social_score: number | null | undefined;
  onchain_score: number | null | undefined;
  engagement_velocity?: number | null;
}

export interface UseViralityScoreResult extends ViralityResult {
  /** Pulse animation profile derived from engagement velocity. */
  pulse: PulseProfile;
  /** Ring gradient stops + social/onchain weight balance. */
  gradient: RingGradient;
  /** Blended color of the fused score along the social/onchain mix. */
  color: string;
  /** Human label + intensity tier for badges. */
  tier: { label: string; intensity: number };
}

/**
 * Recompute the fused virality score from sub-scores using the current
 * filter-rail social/onchain weighting, plus the pulse + gradient derived from
 * engagement velocity and the signal mix.
 */
export function useViralityScore(input: ViralityScoreInput): UseViralityScoreResult {
  const weights = useScoreWeights();

  return useMemo(() => {
    const fused = fuseScores(
      Number(input.social_score) || 0,
      Number(input.onchain_score) || 0,
      weights,
    );
    const grad = ringGradient(input.social_score, input.onchain_score);
    const pulse = pulseFromVelocity(input.engagement_velocity);
    const color = fusedColor(grad.socialWeight);
    const tier = viralityTier(fused.virality_score);
    return { ...fused, pulse, gradient: grad, color, tier };
  }, [input.social_score, input.onchain_score, input.engagement_velocity, weights]);
}

/**
 * Stateless variant for rendering many rows without hook overhead per row —
 * pass explicit weights (e.g. from a single parent useScoreWeights call).
 */
export function computeViralityView(
  input: ViralityScoreInput,
  weights: { social: number; onchain: number },
): UseViralityScoreResult {
  const fused = fuseScores(
    Number(input.social_score) || 0,
    Number(input.onchain_score) || 0,
    weights,
  );
  const grad = ringGradient(input.social_score, input.onchain_score);
  const pulse = pulseFromVelocity(input.engagement_velocity);
  const color = fusedColor(grad.socialWeight);
  const tier = viralityTier(fused.virality_score);
  return { ...fused, pulse, gradient: grad, color, tier };
}
