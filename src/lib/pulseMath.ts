// Maps engagement velocity to the Virality Pulse ring's animation behavior
// and blends its gradient stops from the social/onchain weight balance.
import { clamp } from './formatMetrics';

const SOCIAL = '#FF2E97';
const ONCHAIN = '#1FE0C8';

export interface PulseProfile {
  // seconds per beat — lower = faster throb
  durationSec: number;
  // 0..1 bloom intensity used for glow opacity
  glow: number;
  // 0..1 how aggressively the ring scales each beat
  scaleDelta: number;
}

/**
 * Map engagement velocity (mentions/engagement per hour-ish, unbounded positive)
 * to a pulse profile. Higher velocity => faster + hotter.
 */
export function pulseFromVelocity(engagementVelocity: number | null | undefined): PulseProfile {
  const v = clamp(Number(engagementVelocity) || 0, 0, 1000);
  // normalize on a soft log curve so small values still register motion
  const norm = clamp(Math.log10(v + 1) / 3, 0, 1); // log10(1001)/3 ~= 1
  const durationSec = 2.6 - norm * 1.9; // 2.6s (calm) -> 0.7s (frenetic)
  const glow = 0.25 + norm * 0.65; // 0.25 -> 0.9
  const scaleDelta = 0.02 + norm * 0.06; // subtle -> noticeable
  return {
    durationSec: Number(durationSec.toFixed(3)),
    glow: Number(glow.toFixed(3)),
    scaleDelta: Number(scaleDelta.toFixed(3)),
  };
}

/**
 * Blend the ring gradient based on relative social vs onchain contribution.
 * Returns CSS color stops magenta(social) -> cyan(onchain).
 */
export interface RingGradient {
  from: string;
  to: string;
  socialWeight: number; // 0..1
  onchainWeight: number; // 0..1
}

export function ringGradient(
  socialScore: number | null | undefined,
  onchainScore: number | null | undefined,
): RingGradient {
  const s = clamp(Number(socialScore) || 0, 0, 100);
  const o = clamp(Number(onchainScore) || 0, 0, 100);
  const total = s + o;
  let socialWeight = 0.5;
  let onchainWeight = 0.5;
  if (total > 0) {
    socialWeight = s / total;
    onchainWeight = o / total;
  }
  return {
    from: SOCIAL,
    to: ONCHAIN,
    socialWeight: Number(socialWeight.toFixed(3)),
    onchainWeight: Number(onchainWeight.toFixed(3)),
  };
}

/** Hex -> rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

/** Linear interpolation between two hex colors. t in 0..1 */
export function lerpHex(a: string, b: string, t: number): string {
  const ah = a.replace('#', '');
  const bh = b.replace('#', '');
  const ar = parseInt(ah.substring(0, 2), 16);
  const ag = parseInt(ah.substring(2, 4), 16);
  const ab = parseInt(ah.substring(4, 6), 16);
  const br = parseInt(bh.substring(0, 2), 16);
  const bg = parseInt(bh.substring(2, 4), 16);
  const bb = parseInt(bh.substring(4, 6), 16);
  const k = clamp(t, 0, 1);
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

/**
 * Color of the fused virality value — blended along the social/onchain mix.
 */
export function fusedColor(socialWeight: number): string {
  // socialWeight=1 => magenta, 0 => cyan
  return lerpHex(ONCHAIN, SOCIAL, clamp(socialWeight, 0, 1));
}

/**
 * Build the conic-gradient stop array for a ring with `progress` (0..100)
 * blended between social and onchain colors. Returns a CSS conic-gradient.
 */
export function ringConicGradient(
  progress: number,
  grad: RingGradient,
): string {
  const pct = clamp(progress, 0, 100);
  const mid = lerpHex(grad.to, grad.from, grad.socialWeight);
  return `conic-gradient(from -90deg, ${grad.from} 0deg, ${mid} ${pct * 1.8}deg, ${grad.to} ${pct * 3.6}deg, rgba(122,107,148,0.12) ${pct * 3.6}deg)`;
}
