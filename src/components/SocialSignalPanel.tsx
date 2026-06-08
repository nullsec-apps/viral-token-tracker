import { motion } from 'framer-motion';
import {
  MessageCircle,
  TrendingUp,
  Zap,
  Twitter,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  formatInt,
  formatSignedPercent,
  formatCompact,
  directionOf,
  arrowGlyph,
  clamp,
} from '../lib/formatMetrics';

const MAGENTA = '#FF2E97';

export interface SocialMetrics {
  mention_count_1h?: number | null;
  mention_change_pct?: number | null;
  engagement_velocity?: number | null;
  twitter_query?: string | null;
}

interface SocialSignalPanelProps {
  metrics?: SocialMetrics | null;
  socialScore?: number | null;
  loading?: boolean;
  symbol?: string | null;
  className?: string;
}

export function SocialSignalPanel({
  metrics,
  socialScore,
  loading,
  symbol,
  className,
}: SocialSignalPanelProps) {
  const m = metrics || {};
  const changeDir = directionOf(m.mention_change_pct);
  const velDir = directionOf(m.engagement_velocity, 1);
  const score = clamp(Number(socialScore) || 0, 0, 100);

  const searchUrl = m.twitter_query
    ? `https://x.com/search?q=${encodeURIComponent(m.twitter_query)}&f=live`
    : symbol
      ? `https://x.com/search?q=${encodeURIComponent('$' + symbol.replace(/^\$/, ''))}&f=live`
      : 'https://x.com/explore';

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={className}
      >
        <Card className="relative overflow-hidden border-[#FF2E97]/25 bg-[#14091F]/80 p-4 transition-all duration-200 hover:border-[#FF2E97]/40">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${MAGENTA}, transparent)` }}
          />
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4" style={{ color: MAGENTA }} strokeWidth={2} />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#F2ECFF]">
                Social signal
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-[#7A6B94]">
                    <Info className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs border-[#2A1840] bg-[#14091F] text-[11px] text-[#F2ECFF]">
                  X/Twitter mention velocity over the last hour. Magenta encodes social hype.
                </TooltipContent>
              </Tooltip>
            </div>
            <Badge className="border-[#FF2E97]/40 bg-[#FF2E97]/10 font-mono text-[11px] tabular-nums text-[#FF2E97]">
              {Math.round(score)}
            </Badge>
          </div>

          <div className="mb-3">
            <Progress
              value={score}
              className="h-1.5 bg-[#2A1840]"
              style={{ ['--progress-color' as any]: MAGENTA }}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-[#2A1840]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <MetricCell
                icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Mentions/hr"
                value={formatInt(m.mention_count_1h)}
              />
              <MetricCell
                icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Δ Mentions"
                value={`${arrowGlyph(changeDir)} ${formatSignedPercent(m.mention_change_pct)}`}
              />
              <MetricCell
                icon={<Zap className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Eng. velocity"
                value={`${arrowGlyph(velDir)} ${formatCompact(m.engagement_velocity)}`}
              />
            </div>
          )}

          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#FF2E97]/30 bg-[#FF2E97]/10 px-2.5 py-2 font-mono text-[11px] text-[#FF2E97] transition-all duration-200 hover:border-[#FF2E97]/60 hover:bg-[#FF2E97]/20"
          >
            View live mentions on X
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

function MetricCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#FF2E97]/15 bg-[#0A0612]/60 p-3 transition-all duration-200 hover:border-[#FF2E97]/35">
      <div className="mb-1.5 flex items-center gap-1 text-[#FF2E97]">{icon}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">{label}</div>
      <div className="mt-1 font-mono text-[11px] font-semibold tabular-nums text-[#F2ECFF]">{value}</div>
    </div>
  );
}

export default SocialSignalPanel;
