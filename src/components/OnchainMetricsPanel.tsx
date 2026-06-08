// On-chain metrics dashboard (cyan-themed). Volume spikes, holder growth,
// tx count, liquidity, market cap, price — for the right rail + detail page.
import { motion } from 'framer-motion';
import {
  Boxes,
  Activity,
  Users,
  Droplets,
  TrendingUp,
  Coins,
  ExternalLink,
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
  formatCompactUsd,
  formatCompact,
  formatInt,
  formatPrice,
  formatSignedPercent,
  directionOf,
  arrowGlyph,
  clamp,
} from '../lib/formatMetrics';

const CYAN = '#1FE0C8';

export interface OnchainMetrics {
  volume_spike_pct?: number | null;
  volume_24h?: number | null;
  new_holders_1h?: number | null;
  holder_count?: number | null;
  tx_count_1h?: number | null;
  liquidity_usd?: number | null;
  market_cap?: number | null;
  price_usd?: number | null;
  dex_url?: string | null;
  token_address?: string | null;
}

interface OnchainMetricsPanelProps {
  metrics: OnchainMetrics | null | undefined;
  loading?: boolean;
  onchainScore?: number | null;
  className?: string;
}

function MetricCell({
  icon: Icon,
  label,
  value,
  sub,
  delay = 0,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub?: { text: string; color: string } | null;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-lg border border-[#1FE0C8]/15 bg-[#0A0612]/60 p-3 transition-all duration-200 hover:border-[#1FE0C8]/35"
    >
      <div className="flex items-center gap-1.5 text-[#7A6B94]">
        <Icon size={13} strokeWidth={2} className="text-[#1FE0C8]" />
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums leading-none text-[#F2ECFF]">
        {value}
      </p>
      {sub && (
        <p
          className="mt-1 font-mono text-[11px] tabular-nums"
          style={{ color: sub.color }}
        >
          {sub.text}
        </p>
      )}
    </motion.div>
  );
}

export function OnchainMetricsPanel({
  metrics,
  loading = false,
  onchainScore,
  className,
}: OnchainMetricsPanelProps) {
  if (loading) {
    return (
      <Card className={`border-[#1FE0C8]/25 bg-[#14091F]/80 p-4 ${className || ''}`}>
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-4 w-32 bg-[#2A1840]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-[#2A1840]" />
          ))}
        </div>
      </Card>
    );
  }

  const m = metrics || {};
  const volDir = directionOf(m.volume_spike_pct);
  const holderDir = directionOf(m.new_holders_1h);
  const score = clamp(Number(onchainScore) || 0, 0, 100);

  return (
    <Card
      className={`relative overflow-hidden border-[#1FE0C8]/25 bg-[#14091F]/80 p-4 transition-all duration-200 hover:border-[#1FE0C8]/40 ${className || ''}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)` }}
      />
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#1FE0C8]">
          <Boxes size={14} strokeWidth={2} />
          Onchain signals
        </span>
        {onchainScore != null && (
          <Badge
            variant="outline"
            className="border-[#1FE0C8]/40 bg-[#1FE0C8]/10 font-mono text-[11px] tabular-nums text-[#1FE0C8]"
          >
            score {score.toFixed(0)}
          </Badge>
        )}
      </div>

      {onchainScore != null && (
        <div className="mb-3">
          <Progress
            value={score}
            className="h-1.5 bg-[#2A1840]"
            indicatorClassName="bg-[#1FE0C8]"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <MetricCell
          icon={TrendingUp}
          label="Vol spike"
          value={formatSignedPercent(m.volume_spike_pct)}
          sub={{
            text: `${arrowGlyph(volDir)} 1h window`,
            color: volDir === 'down' ? '#7A6B94' : CYAN,
          }}
          delay={0}
        />
        <MetricCell
          icon={Activity}
          label="24h volume"
          value={formatCompactUsd(m.volume_24h)}
          delay={0.04}
        />
        <MetricCell
          icon={Users}
          label="New holders/1h"
          value={formatCompact(m.new_holders_1h)}
          sub={{
            text: `${arrowGlyph(holderDir)} growth`,
            color: holderDir === 'down' ? '#7A6B94' : CYAN,
          }}
          delay={0.08}
        />
        <MetricCell
          icon={Users}
          label="Holders"
          value={formatInt(m.holder_count)}
          delay={0.12}
        />
        <MetricCell
          icon={Activity}
          label="Tx count/1h"
          value={formatCompact(m.tx_count_1h)}
          delay={0.16}
        />
        <MetricCell
          icon={Droplets}
          label="Liquidity"
          value={formatCompactUsd(m.liquidity_usd)}
          delay={0.2}
        />
        <MetricCell
          icon={Coins}
          label="Market cap"
          value={formatCompactUsd(m.market_cap)}
          delay={0.24}
        />
        <MetricCell
          icon={Coins}
          label="Price"
          value={formatPrice(m.price_usd)}
          delay={0.28}
        />
      </div>

      {(m.dex_url || m.token_address) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {m.dex_url && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={m.dex_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#1FE0C8]/30 bg-[#1FE0C8]/10 px-2.5 py-1.5 font-mono text-[11px] text-[#1FE0C8] transition-all duration-200 hover:border-[#1FE0C8]/60 hover:bg-[#1FE0C8]/20"
                  >
                    <ExternalLink size={12} /> DexScreener
                  </a>
                </TooltipTrigger>
                <TooltipContent className="border-[#1FE0C8]/30 bg-[#0A0612] text-[#F2ECFF]">
                  <p className="text-xs">Verify the Base pair on DexScreener</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {m.token_address && (
            <a
              href={`https://basescan.org/token/${m.token_address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#7A6B94]/30 bg-[#0A0612]/60 px-2.5 py-1.5 font-mono text-[11px] text-[#7A6B94] transition-all duration-200 hover:border-[#F2ECFF]/40 hover:text-[#F2ECFF]"
            >
              <ExternalLink size={12} /> Basescan
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

export default OnchainMetricsPanel;
