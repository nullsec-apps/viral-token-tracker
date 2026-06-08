// Market-wide social-velocity radial gauge. Neon arc fills with aggregate
// mentions/hr across tracked tokens. Used in the left rail + cooling-off state.
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMarketVelocityGauge } from '../hooks/useMarketVelocityGauge';
import { formatCompact, formatInt, clamp } from '../lib/formatMetrics';

interface MarketVelocityGaugeProps {
  size?: number;
  compact?: boolean;
  className?: string;
}

export function MarketVelocityGauge({
  size = 180,
  compact = false,
  className,
}: MarketVelocityGaugeProps) {
  const { velocity, loading, isExample } = useMarketVelocityGauge();

  const stroke = compact ? 10 : 14;
  const r = (size - stroke) / 2;
  // semicircle gauge: 180deg arc
  const circumference = Math.PI * r;
  const fill = clamp(velocity.gaugeValue, 0, 100) / 100;
  const dash = circumference * fill;
  const cx = size / 2;
  const cy = size / 2;

  // color shifts magenta (social heat) as the gauge fills
  const hot = fill;
  const gaugeColor = hot > 0.66 ? '#FF2E97' : hot > 0.33 ? '#C56BFF' : '#1FE0C8';

  return (
    <Card
      className={`relative overflow-hidden border-[#FF2E97]/25 bg-[#14091F]/80 p-4 transition-all duration-200 hover:border-[#FF2E97]/40 ${className || ''}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#FF2E97]">
          <Activity size={13} strokeWidth={2} />
          Market velocity
        </span>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-[#7A6B94] transition-colors duration-200 hover:text-[#F2ECFF]">
                <Info size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] border-[#FF2E97]/30 bg-[#0A0612] text-[#F2ECFF]">
              <p className="text-xs leading-relaxed">
                Aggregate X/Twitter mentions per hour across all tracked Base
                tokens, mapped onto a soft log curve.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative mx-auto" style={{ width: size, height: size / 2 + stroke }}>
        <svg
          width={size}
          height={size / 2 + stroke}
          viewBox={`0 0 ${size} ${size / 2 + stroke}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="mvg-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1FE0C8" />
              <stop offset="55%" stopColor="#C56BFF" />
              <stop offset="100%" stopColor="#FF2E97" />
            </linearGradient>
            <filter id="mvg-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* track */}
          <path
            d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
            fill="none"
            stroke="#2A1840"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* fill */}
          <motion.path
            d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
            fill="none"
            stroke="url(#mvg-grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            filter="url(#mvg-glow)"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div
          className="absolute inset-x-0 flex flex-col items-center"
          style={{ top: size / 2 - (compact ? 34 : 42) }}
        >
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-[#2A1840]" />
          ) : (
            <motion.span
              key={velocity.mentionsPerHour}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-display text-3xl font-bold tabular-nums leading-none"
              style={{ color: gaugeColor }}
            >
              {formatCompact(velocity.mentionsPerHour)}
            </motion.span>
          )}
          <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]">
            mentions / hr
          </span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-[#1FE0C8]/15 bg-[#0A0612]/60 px-2 py-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]">
            Tokens
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums text-[#F2ECFF]">
            {formatInt(velocity.tokenCount)}
          </p>
        </div>
        <div className="rounded-md border border-[#FF2E97]/15 bg-[#0A0612]/60 px-2 py-1.5">
          <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]">
            <TrendingUp size={10} /> Engage
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums text-[#FF2E97]">
            {formatCompact(velocity.engagementVelocity)}
          </p>
        </div>
      </div>

      {isExample && (
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]">
          example data · awaiting pipeline
        </p>
      )}
    </Card>
  );
}

export default MarketVelocityGauge;
