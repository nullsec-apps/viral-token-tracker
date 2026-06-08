// Signature element — circular animated score ring per token (0-100).
// Throbs faster + glows hotter as engagement velocity rises; ring color blends
// magenta (social) and cyan (onchain). Thin sparkline tail of last 60 minutes.
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { computeViralityView } from '../hooks/useViralityScore';
import { useScoreWeights } from '../hooks/useFilterStore';
import { ringConicGradient, hexToRgba } from '../lib/pulseMath';
import { clamp } from '../lib/formatMetrics';

interface ViralityPulseProps {
  viralityScore?: number | null;
  socialScore?: number | null;
  onchainScore?: number | null;
  engagementVelocity?: number | null;
  sparkline?: number[];
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function ViralityPulse({
  viralityScore,
  socialScore,
  onchainScore,
  engagementVelocity,
  sparkline = [],
  size = 64,
  showLabel = true,
  className,
}: ViralityPulseProps) {
  const weights = useScoreWeights();
  const view = useMemo(
    () =>
      computeViralityView(
        {
          social_score: socialScore,
          onchain_score: onchainScore,
          engagement_velocity: engagementVelocity,
        },
        weights,
      ),
    [socialScore, onchainScore, engagementVelocity, weights],
  );

  const score = clamp(
    Number(viralityScore ?? view.virality_score) || 0,
    0,
    100,
  );
  const { pulse, gradient, color } = view;
  const conic = ringConicGradient(score, gradient);

  const inner = size - Math.max(8, size * 0.16);
  const sparkW = size;
  const sparkH = Math.max(10, size * 0.22);

  const sparkPath = useMemo(() => {
    const pts = sparkline.slice(-60);
    if (pts.length < 2) return '';
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const stepX = sparkW / (pts.length - 1);
    return pts
      .map((v, i) => {
        const x = i * stepX;
        const y = sparkH - ((v - min) / range) * (sparkH - 2) - 1;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [sparkline, sparkW, sparkH]);

  return (
    <div
      className={`flex flex-col items-center gap-1 ${className || ''}`}
      style={{ width: size }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* outer glow throb tied to engagement velocity */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(color, pulse.glow * 0.6)} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1 + pulse.scaleDelta * 2.2, 1],
            opacity: [pulse.glow * 0.5, pulse.glow, pulse.glow * 0.5],
          }}
          transition={{
            duration: pulse.durationSec,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* conic ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: conic,
            boxShadow: `0 0 ${size * 0.22}px ${hexToRgba(color, pulse.glow * 0.7)}`,
          }}
          animate={{ scale: [1, 1 + pulse.scaleDelta, 1] }}
          transition={{
            duration: pulse.durationSec,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* inner disc */}
        <div
          className="absolute rounded-full bg-[#0A0612]"
          style={{
            inset: (size - inner) / 2,
            boxShadow: `inset 0 0 ${size * 0.1}px ${hexToRgba(color, 0.25)}`,
          }}
        />
        {/* score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={Math.round(score)}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="font-display font-bold tabular-nums leading-none"
            style={{ color, fontSize: size * 0.32 }}
          >
            {Math.round(score)}
          </motion.span>
          {showLabel && size >= 56 && (
            <span
              className="font-mono uppercase tracking-wider text-[#7A6B94]"
              style={{ fontSize: Math.max(7, size * 0.11), marginTop: 1 }}
            >
              VIR
            </span>
          )}
        </div>
      </div>

      {sparkPath && size >= 48 && (
        <svg
          width={sparkW}
          height={sparkH}
          viewBox={`0 0 ${sparkW} ${sparkH}`}
          className="overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={`vp-spark-${size}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1FE0C8" stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <path
            d={sparkPath}
            fill="none"
            stroke={`url(#vp-spark-${size})`}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export default ViralityPulse;
