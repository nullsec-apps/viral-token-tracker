// Pure scoring functions: compute social_score, onchain_score, and the fused
// virality_score from raw metrics. Social signals are magenta, onchain are cyan.
import { clamp } from './formatMetrics';

export interface RawSocialMetrics {
  mention_count_1h?: number | null;
  mention_change_pct?: number | null;
  engagement_velocity?: number | null;
}

export interface RawOnchainMetrics {
  volume_spike_pct?: number | null;
  volume_24h?: number | null;
  new_holders_1h?: number | null;
  tx_count_1h?: number | null;
  liquidity_usd?: number | null;
  volume_to_market_cap?: number | null;
}

export interface ScoreWeights {
  // 0..1, social + onchain should sum to 1 (auto-normalized otherwise)
  social: number;
  onchain: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = { social: 0.5, onchain: 0.5 };

function n(v: number | null | undefined): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

/** Soft-saturating curve: maps an unbounded positive value to 0..100. */
function saturate(value: number, halfPoint: number): number {
  const v = Math.max(0, value);
  // logistic-ish: reaches ~50 at halfPoint, asymptotes to 100
  return clamp((v / (v + halfPoint)) * 100, 0, 100);
}

/** Percent-change curve clamped, where positive change drives the score up. */
function percentScore(pct: number, fullAt = 300): number {
  return clamp((Math.max(0, pct) / fullAt) * 100, 0, 100);
}

export function computeSocialScore(m: RawSocialMetrics): number {
  const mentions = saturate(n(m.mention_count_1h), 250); // 250 mentions/hr ~ 50
  const change = percentScore(n(m.mention_change_pct), 300); // +300% ~ 100
  const velocity = saturate(n(m.engagement_velocity), 120);
  // weighted blend within social bucket
  const score = mentions * 0.35 + change * 0.35 + velocity * 0.3;
  return Number(clamp(score, 0, 100).toFixed(2));
}

export function computeOnchainScore(m: RawOnchainMetrics): number {
  const volSpike = percentScore(n(m.volume_spike_pct), 500); // +500% spike ~ 100
  const holders = saturate(n(m.new_holders_1h), 400); // 400 new holders/hr ~ 50
  const txs = saturate(n(m.tx_count_1h), 800);
  const liquidity = saturate(n(m.liquidity_usd), 250_000);
  const volRatio = clamp(n(m.volume_to_market_cap) * 100, 0, 100);
  const score =
    volSpike * 0.3 +
    holders * 0.25 +
    txs * 0.2 +
    liquidity * 0.1 +
    volRatio * 0.15;
  return Number(clamp(score, 0, 100).toFixed(2));
}

export function normalizeWeights(w: ScoreWeights): ScoreWeights {
  const s = Math.max(0, n(w.social));
  const o = Math.max(0, n(w.onchain));
  const total = s + o;
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  return { social: s / total, onchain: o / total };
}

export interface ViralityResult {
  social_score: number;
  onchain_score: number;
  virality_score: number;
  weights: ScoreWeights;
}

export function computeVirality(
  social: RawSocialMetrics,
  onchain: RawOnchainMetrics,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): ViralityResult {
  const social_score = computeSocialScore(social);
  const onchain_score = computeOnchainScore(onchain);
  return fuseScores(social_score, onchain_score, weights);
}

/** Fuse already-computed sub-scores with given weights. */
export function fuseScores(
  social_score: number,
  onchain_score: number,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): ViralityResult {
  const w = normalizeWeights(weights);
  const s = clamp(n(social_score), 0, 100);
  const o = clamp(n(onchain_score), 0, 100);
  const virality_score = Number(clamp(s * w.social + o * w.onchain, 0, 100).toFixed(2));
  return {
    social_score: Number(s.toFixed(2)),
    onchain_score: Number(o.toFixed(2)),
    virality_score,
    weights: w,
  };
}

/** Heuristic label/tier for a virality score for UI badges. */
export function viralityTier(score: number): { label: string; intensity: number } {
  const s = clamp(n(score), 0, 100);
  if (s >= 85) return { label: 'GOING VIRAL', intensity: 1 };
  if (s >= 70) return { label: 'HEATING UP', intensity: 0.8 };
  if (s >= 50) return { label: 'BUILDING', intensity: 0.6 };
  if (s >= 30) return { label: 'EMERGING', intensity: 0.4 };
  return { label: 'COOLING', intensity: 0.2 };
}

/** Whether a token crosses a given virality threshold filter. */
export function crossesThreshold(score: number | null | undefined, threshold: number): boolean {
  return n(score) >= n(threshold);
}
