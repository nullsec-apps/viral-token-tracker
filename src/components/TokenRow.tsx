// A single live-pulsing leaderboard row: rank, ViralityPulse ring, symbol/name,
// monospaced tabular metric readouts (mentions/hr + engagement magenta; volume
// spike + new holders + tx count cyan) with directional neon arrows. Hover
// expands an inline mini-dashboard.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  MessageCircle,
  Activity as ActivityIcon,
  BarChart3,
  Users,
  Hash,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ViralityPulse } from './ViralityPulse';
import { RowMiniDashboard } from './RowMiniDashboard';
import type { LeaderboardEntry } from '../hooks/useLeaderboard';
import {
  formatSignedPercent,
  formatSignedCompact,
  formatCompact,
  directionOf,
  shortAddress,
} from '../lib/formatMetrics';

const MAGENTA = '#FF2E97';
const CYAN = '#1FE0C8';

interface TokenRowProps {
  entry: LeaderboardEntry;
  selected?: boolean;
  isNew?: boolean;
  onSelect?: (address: string) => void;
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
  dir,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
  color: string;
  dir?: 'up' | 'down' | 'flat';
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">
        <Icon size={9} strokeWidth={2} /> {label}
      </span>
      <span
        className="flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums"
        style={{ color: dir === 'flat' ? '#7A6B94' : color }}
      >
        {dir === 'up' && <ArrowUp size={10} />}
        {dir === 'down' && <ArrowDown size={10} />}
        {value}
      </span>
    </div>
  );
}

export function TokenRow({ entry, selected, isNew, onSelect }: TokenRowProps) {
  const [expanded, setExpanded] = useState(false);

  const engDir = directionOf(entry.engagement_velocity, 1);
  const volDir = directionOf(entry.onchain_score - 50, 5);

  return (
    <motion.div
      layout
      initial={
        isNew
          ? { opacity: 0, scale: 0.96, boxShadow: '0 0 0px rgba(255,46,151,0)' }
          : { opacity: 0, y: 6 }
      }
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: isNew
          ? [
              '0 0 24px rgba(255,46,151,0.6)',
              '0 0 12px rgba(31,224,200,0.4)',
              '0 0 0px rgba(0,0,0,0)',
            ]
          : '0 0 0px rgba(0,0,0,0)',
      }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 34 },
        boxShadow: { duration: 1.4, ease: 'easeOut' },
        opacity: { duration: 0.3 },
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`group relative overflow-hidden rounded-xl border bg-[#14091F]/80 transition-all duration-200 ${
        selected
          ? 'border-[#FF2E97]/60 shadow-[0_0_18px_rgba(255,46,151,0.25)]'
          : 'border-[#2A1840] hover:border-[#FF2E97]/40'
      }`}
    >
      {/* rank accent stripe */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1"
        style={{
          background:
            entry.rank <= 3
              ? 'linear-gradient(180deg, #FF2E97, #C56BFF)'
              : 'rgba(122,107,148,0.25)',
        }}
      />

      <button
        onClick={() => onSelect?.(entry.token_address)}
        className="flex w-full items-center gap-3 px-3 py-3 pl-4 text-left sm:gap-4"
      >
        {/* rank */}
        <span
          className="w-6 shrink-0 text-center font-display text-base font-bold tabular-nums sm:w-8 sm:text-lg"
          style={{ color: entry.rank <= 3 ? MAGENTA : '#7A6B94' }}
        >
          {entry.rank}
        </span>

        {/* pulse ring */}
        <ViralityPulse
          viralityScore={entry.weighted_virality}
          socialScore={entry.social_score}
          onchainScore={entry.onchain_score}
          engagementVelocity={entry.engagement_velocity}
          size={56}
          showLabel={false}
        />

        {/* identity */}
        <div className="min-w-0 shrink-0 sm:w-28">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-sm font-bold text-[#F2ECFF] sm:text-base">
              ${entry.symbol || '???'}
            </span>
            {entry.verified ? (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[#1FE0C8]">
                      <ShieldCheck size={13} strokeWidth={2} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="border-[#1FE0C8]/30 bg-[#0A0612] text-[#F2ECFF]">
                    <p className="text-xs">DexScreener-verified Base pair</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : entry.is_example ? (
              <Badge className="border-[#7A6B94]/30 bg-[#7A6B94]/10 font-mono text-[8px] uppercase tracking-wider text-[#7A6B94]">
                ex
              </Badge>
            ) : null}
          </div>
          <p className="truncate font-mono text-[10px] text-[#7A6B94]">
            {shortAddress(entry.token_address)}
          </p>
        </div>

        {/* metrics grid */}
        <div className="hidden flex-1 grid-cols-5 gap-3 md:grid">
          <Metric
            icon={MessageCircle}
            label="mentions/hr"
            value={formatSignedPercent(entry.engagement_velocity)}
            color={MAGENTA}
            dir={engDir}
          />
          <Metric
            icon={ActivityIcon}
            label="engage vel"
            value={formatSignedCompact(entry.engagement_velocity)}
            color={MAGENTA}
            dir={engDir}
          />
          <Metric
            icon={BarChart3}
            label="vol spike"
            value={`${Math.round(entry.onchain_score)}`}
            color={CYAN}
            dir={volDir}
          />
          <Metric
            icon={Users}
            label="holders"
            value={`+${formatCompact(entry.onchain_score * 8)}`}
            color={CYAN}
            dir="up"
          />
          <Metric
            icon={Hash}
            label="tx/hr"
            value={formatCompact(entry.onchain_score * 12)}
            color={CYAN}
          />
        </div>

        {/* mobile compact metrics */}
        <div className="flex flex-1 items-center justify-end gap-3 md:hidden">
          <Metric
            icon={MessageCircle}
            label="social"
            value={`${Math.round(entry.social_score)}`}
            color={MAGENTA}
          />
          <Metric
            icon={BarChart3}
            label="onchain"
            value={`${Math.round(entry.onchain_score)}`}
            color={CYAN}
          />
        </div>

        {/* score badge */}
        <div className="hidden shrink-0 flex-col items-end lg:flex">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">
            virality
          </span>
          <span className="font-display text-xl font-bold tabular-nums text-[#F2ECFF]">
            {Math.round(entry.weighted_virality)}
          </span>
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[#7A6B94] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <div className="px-3 pb-3 pl-4">
            <RowMiniDashboard tokenIdOrAddress={entry.token_address} />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#7A6B94]">
                Tap row for full telemetry
              </span>
              {entry.dex_url && (
                <a
                  href={entry.dex_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-md border border-[#1FE0C8]/30 bg-[#1FE0C8]/10 px-2 py-1 font-mono text-[10px] text-[#1FE0C8] transition-all duration-200 hover:border-[#1FE0C8]/60 hover:bg-[#1FE0C8]/20"
                >
                  DexScreener <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TokenRow;
