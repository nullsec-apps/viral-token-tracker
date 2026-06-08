import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Layers, Clock, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useViralityScore } from '../hooks/useViralityScore';
import { useFilterStore } from '../hooks/useFilterStore';
import { clamp, timeAgo } from '../lib/formatMetrics';

const MAGENTA = '#FF2E97';
const CYAN = '#1FE0C8';

interface ScoreBreakdownProps {
  socialScore: number | null | undefined;
  onchainScore: number | null | undefined;
  engagementVelocity?: number | null;
  updatedAt?: string | number | Date | null;
  className?: string;
}

export function ScoreBreakdown({
  socialScore,
  onchainScore,
  engagementVelocity,
  updatedAt,
  className,
}: ScoreBreakdownProps) {
  const socialWeight = useFilterStore((s) => s.socialWeight);
  const result = useViralityScore({
    social_score: socialScore,
    onchain_score: onchainScore,
    engagement_velocity: engagementVelocity,
  });

  const s = clamp(Number(socialScore) || 0, 0, 100);
  const o = clamp(Number(onchainScore) || 0, 0, 100);
  const fused = result.virality_score;

  const socialPct = Math.round(socialWeight * 100);
  const onchainPct = 100 - socialPct;

  const socialContribution = useMemo(
    () => Number((s * socialWeight).toFixed(1)),
    [s, socialWeight],
  );
  const onchainContribution = useMemo(
    () => Number((o * (1 - socialWeight)).toFixed(1)),
    [o, socialWeight],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={className}
      >
        <Card className="relative overflow-hidden border-[#C56BFF]/25 bg-[#14091F]/80 p-4 transition-all duration-200 hover:border-[#C56BFF]/40">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, ${MAGENTA}, #C56BFF, ${CYAN})` }}
          />
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" style={{ color: '#C56BFF' }} strokeWidth={2} />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#F2ECFF]">
                Score breakdown
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-[#7A6B94]">
                    <Info className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs border-[#2A1840] bg-[#14091F] text-[11px] text-[#F2ECFF]">
                  Fused = social × {socialPct}% + onchain × {onchainPct}%. Adjust the weighting in the filter rail.
                </TooltipContent>
              </Tooltip>
            </div>
            <span
              className="font-display text-2xl font-bold tabular-nums leading-none"
              style={{ color: result.color }}
            >
              {Math.round(fused)}
            </span>
          </div>

          <div className="space-y-3">
            <SignalBar
              icon={<Zap className="h-3 w-3" strokeWidth={2} />}
              label="Social"
              raw={s}
              weightPct={socialPct}
              contribution={socialContribution}
              color={MAGENTA}
            />
            <SignalBar
              icon={<Layers className="h-3 w-3" strokeWidth={2} />}
              label="Onchain"
              raw={o}
              weightPct={onchainPct}
              contribution={onchainContribution}
              color={CYAN}
            />
          </div>

          <Separator className="my-3 bg-[#2A1840]" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider"
                style={{ borderColor: `${result.color}55`, color: result.color, background: `${result.color}12` }}
              >
                {result.tier.label}
              </span>
              <span className="font-mono text-[10px] text-[#7A6B94]">
                {socialPct}/{onchainPct} mix
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#7A6B94]">
              <Clock className="h-3 w-3" strokeWidth={2} />
              <span className="font-mono text-[10px]">{updatedAt ? timeAgo(updatedAt) : 'live'}</span>
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#0A0612]">
            <div className="flex h-full w-full">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(socialContribution / Math.max(fused, 1)) * 100}%`,
                  background: MAGENTA,
                }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(onchainContribution / Math.max(fused, 1)) * 100}%`,
                  background: CYAN,
                }}
              />
            </div>
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

function SignalBar({
  icon,
  label,
  raw,
  weightPct,
  contribution,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  raw: number;
  weightPct: number;
  contribution: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
          {icon}
          {label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-[#7A6B94]">
          <span style={{ color }}>{Math.round(raw)}</span> × {weightPct}% ={' '}
          <span className="font-semibold" style={{ color }}>
            {contribution}
          </span>
        </span>
      </div>
      <Progress
        value={clamp(raw, 0, 100)}
        className="h-1.5 bg-[#2A1840]"
        style={{ ['--progress-color' as any]: color }}
      />
    </div>
  );
}

export default ScoreBreakdown;
