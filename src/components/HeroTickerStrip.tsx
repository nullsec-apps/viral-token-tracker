// Top-3 live ticker proof module + first-load headline/CTA. Marquee of the
// highest-virality tokens, each chip carrying a mini pulsing ViralityPulse.
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowUp, ArrowDown, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { ViralityPulse } from './ViralityPulse';
import {
  formatSignedPercent,
  formatSignedCompact,
  formatCompactUsd,
  directionOf,
} from '../lib/formatMetrics';

interface HeroTickerStripProps {
  showHero?: boolean;
  onOpenLeaderboard?: () => void;
  onSelectToken?: (address: string) => void;
  className?: string;
}

export function HeroTickerStrip({
  showHero = false,
  onOpenLeaderboard,
  onSelectToken,
  className,
}: HeroTickerStripProps) {
  const { top3, loading, isExample } = useLeaderboard();

  const chips = useMemo(() => top3.slice(0, 3), [top3]);

  return (
    <div className={className}>
      {showHero && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mb-4 overflow-hidden rounded-xl border border-[#FF2E97]/20 bg-gradient-to-br from-[#14091F] via-[#14091F] to-[#1a0a2e] px-4 py-5 sm:px-6 sm:py-7"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,46,151,0.06) 0px, rgba(255,46,151,0.06) 1px, transparent 1px, transparent 4px)',
            }}
          />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF2E97]/40 bg-[#FF2E97]/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF2E97]">
              <Sparkles size={11} strokeWidth={2} /> Live virality console · Base
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-[#F2ECFF] sm:text-3xl lg:text-4xl">
              Catch Base tokens while they&apos;re still going viral.
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[#7A6B94] sm:text-base">
              Live virality scores fusing{' '}
              <span className="text-[#FF2E97]">X mention velocity</span> with{' '}
              <span className="text-[#1FE0C8]">onchain volume spikes</span>, holder
              growth, and transaction count — re-ranked every few seconds.
            </p>
            <Button
              onClick={onOpenLeaderboard}
              className="mt-4 h-11 gap-2 border border-[#FF2E97]/50 bg-[#FF2E97]/20 font-display font-semibold text-[#F2ECFF] transition-all duration-200 hover:scale-[1.02] hover:bg-[#FF2E97]/30"
            >
              <Flame size={16} strokeWidth={2} />
              Open the live leaderboard
              <ChevronRight size={16} />
            </Button>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-[#2A1840] bg-[#0A0612]/80 px-2 py-2">
        <span className="flex shrink-0 items-center gap-1.5 px-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF2E97]">
          <Flame size={12} strokeWidth={2} className="animate-pulse" /> Top 3
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading && chips.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-44 shrink-0 animate-pulse rounded-lg bg-[#2A1840]/60"
                />
              ))
            : chips.map((t, idx) => {
                const dir = directionOf(t.engagement_velocity, 1);
                return (
                  <TooltipProvider key={t.id} delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.06 }}
                          onClick={() => onSelectToken?.(t.token_address)}
                          className="group flex shrink-0 items-center gap-2 rounded-lg border border-[#2A1840] bg-[#14091F]/80 py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:border-[#FF2E97]/50 hover:bg-[#14091F]"
                        >
                          <ViralityPulse
                            viralityScore={t.weighted_virality}
                            socialScore={t.social_score}
                            onchainScore={t.onchain_score}
                            engagementVelocity={t.engagement_velocity}
                            size={36}
                            showLabel={false}
                          />
                          <div className="flex flex-col items-start">
                            <span className="flex items-center gap-1">
                              <span className="font-mono text-[10px] font-bold text-[#7A6B94]">
                                #{idx + 1}
                              </span>
                              <span className="font-display text-sm font-bold text-[#F2ECFF]">
                                ${t.symbol || '???'}
                              </span>
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-[#FF2E97]">
                              {dir === 'up' ? (
                                <ArrowUp size={9} />
                              ) : dir === 'down' ? (
                                <ArrowDown size={9} />
                              ) : null}
                              {formatSignedPercent(t.engagement_velocity)}
                            </span>
                          </div>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent className="border-[#FF2E97]/30 bg-[#0A0612] text-[#F2ECFF]">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <p className="font-display text-xs font-bold">
                            ${t.symbol} · Virality {Math.round(t.weighted_virality)}
                          </p>
                          <p className="text-[#FF2E97]">
                            engagement {formatSignedCompact(t.engagement_velocity)}
                          </p>
                          <p className="text-[#1FE0C8]">
                            onchain {Math.round(t.onchain_score)}/100
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
          {!loading && chips.length === 0 && (
            <span className="px-2 font-mono text-[11px] text-[#7A6B94]">
              No tokens crossing threshold yet
            </span>
          )}
        </div>
        {isExample && (
          <Badge className="ml-auto hidden shrink-0 border-[#7A6B94]/30 bg-[#7A6B94]/10 font-mono text-[9px] uppercase tracking-wider text-[#7A6B94] sm:inline-flex">
            example
          </Badge>
        )}
      </div>
    </div>
  );
}

export default HeroTickerStrip;
