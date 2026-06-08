// Right-rail container that expands when a row is selected — composes a large
// ViralityPulse, ScoreBreakdown, SocialSignalPanel, OnchainMetricsPanel, and an
// 'open full detail' link. Empty prompt when nothing selected.
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, ArrowUpRight, ShieldCheck, AlertTriangle, Loader2, MousePointerClick } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ViralityPulse } from './ViralityPulse';
import { ScoreBreakdown } from './ScoreBreakdown';
import { SocialSignalPanel } from './SocialSignalPanel';
import { OnchainMetricsPanel } from './OnchainMetricsPanel';
import { AlertPanel } from './AlertPanel';
import { useTokenDetail } from '../hooks/useTokenDetail';
import { useTokenSnapshots } from '../hooks/useTokenSnapshots';
import { shortAddress } from '../lib/formatMetrics';

interface TokenTelemetryRailProps {
  address?: string | null;
  onOpenDetail?: (address: string) => void;
  className?: string;
}

export function TokenTelemetryRail({
  address,
  onOpenDetail,
  className,
}: TokenTelemetryRailProps) {
  const { token, loading, error, isExample, verification } = useTokenDetail(address);
  const { sparkline } = useTokenSnapshots(address, '1h');

  return (
    <div className={`flex h-full min-h-0 flex-col ${className || ''}`}>
      <div className="mb-3 flex items-center gap-2">
        <Radar size={15} className="text-[#C56BFF]" strokeWidth={2} />
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#F2ECFF]">
          Token telemetry
        </h2>
      </div>

      <ScrollArea className="min-h-0 flex-1 pr-2">
        <AnimatePresence mode="wait">
          {!address ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#7A6B94]/25 bg-[#14091F]/50 px-5 py-10 text-center">
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C56BFF]/30 bg-[#C56BFF]/8 text-[#C56BFF]"
                >
                  <MousePointerClick size={20} strokeWidth={1.5} />
                </motion.span>
                <p className="font-display text-sm font-bold text-[#F2ECFF]">
                  Select a token
                </p>
                <p className="max-w-[220px] font-sans text-xs leading-relaxed text-[#7A6B94]">
                  Tap any row in the leaderboard to expand its full social + onchain
                  telemetry here.
                </p>
              </div>
              <AlertPanel />
            </motion.div>
          ) : loading && !token ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Skeleton className="mx-auto h-24 w-24 rounded-full bg-[#2A1840]" />
              <Skeleton className="h-28 w-full rounded-xl bg-[#2A1840]" />
              <Skeleton className="h-40 w-full rounded-xl bg-[#2A1840]" />
              <div className="flex items-center justify-center gap-2 text-[#7A6B94]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  Loading telemetry…
                </span>
              </div>
            </motion.div>
          ) : error || !token ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 rounded-xl border border-[#FF2E97]/30 bg-[#FF2E97]/8 px-5 py-8 text-center"
            >
              <AlertTriangle size={20} className="text-[#FF2E97]" />
              <p className="font-mono text-xs text-[#FF2E97]">
                {error || 'Token not found'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={token.token_address}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* identity + big pulse */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-[#FF2E97]/20 bg-[#14091F]/70 px-4 py-5">
                <ViralityPulse
                  viralityScore={token.virality_score}
                  socialScore={token.social_score}
                  onchainScore={token.onchain_score}
                  engagementVelocity={token.engagement_velocity}
                  sparkline={sparkline}
                  size={104}
                />
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-lg font-bold text-[#F2ECFF]">
                      ${token.symbol || '???'}
                    </span>
                    {token.verified && (
                      <ShieldCheck size={15} className="text-[#1FE0C8]" strokeWidth={2} />
                    )}
                    {isExample && (
                      <Badge className="border-[#7A6B94]/30 bg-[#7A6B94]/10 font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">
                        example
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-[#7A6B94]">
                    {token.name || 'Unknown'} · {shortAddress(token.token_address)}
                  </p>
                  {verification?.warning && (
                    <p className="max-w-[220px] font-mono text-[9px] leading-snug text-[#7A6B94]">
                      {verification.warning}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => onOpenDetail?.(token.token_address)}
                  size="sm"
                  className="h-9 w-full gap-1.5 border border-[#FF2E97]/40 bg-[#FF2E97]/15 font-mono text-[11px] text-[#F2ECFF] transition-all duration-200 hover:bg-[#FF2E97]/25"
                >
                  Open full detail
                  <ArrowUpRight size={14} />
                </Button>
              </div>

              <ScoreBreakdown
                socialScore={token.social_score}
                onchainScore={token.onchain_score}
                engagementVelocity={token.engagement_velocity}
                updatedAt={token.updated_at}
              />

              <SocialSignalPanel
                metrics={{
                  mention_count_1h: token.mention_count_1h,
                  mention_change_pct: token.mention_change_pct,
                  engagement_velocity: token.engagement_velocity,
                  twitter_query: token.twitter_query,
                }}
                socialScore={token.social_score}
                symbol={token.symbol}
              />

              <OnchainMetricsPanel
                metrics={{
                  volume_spike_pct: token.volume_spike_pct,
                  volume_24h: token.volume_24h,
                  new_holders_1h: token.new_holders_1h,
                  holder_count: token.holder_count,
                  tx_count_1h: token.tx_count_1h,
                  liquidity_usd: token.liquidity_usd,
                  market_cap: token.market_cap,
                  price_usd: token.price_usd,
                  dex_url: token.dex_url,
                  token_address: token.token_address,
                }}
                onchainScore={token.onchain_score}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}

export default TokenTelemetryRail;
