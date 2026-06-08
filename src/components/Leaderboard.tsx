// Center live re-sorting stream. Subscribes to realtime tracked_tokens via
// useLeaderboard, re-orders rows with FLIP transitions, flashes new entrants.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListOrdered, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TokenRow } from './TokenRow';
import { CoolingOffState } from './CoolingOffState';
import { BaseFilterBadge } from './BaseFilterBadge';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  selectedAddress?: string | null;
  onSelectToken?: (address: string) => void;
  className?: string;
}

export function Leaderboard({
  selectedAddress,
  onSelectToken,
  className,
}: LeaderboardProps) {
  const {
    entries,
    loading,
    error,
    isExample,
    noMatches,
    coolingOff,
    refresh,
  } = useLeaderboard();

  // track which ids are newly arriving for the neon-sweep flash
  const seen = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fresh = new Set<string>();
    for (const e of entries) {
      if (!seen.current.has(e.id)) fresh.add(e.id);
      seen.current.add(e.id);
    }
    if (fresh.size > 0) {
      setNewIds(fresh);
      const t = setTimeout(() => setNewIds(new Set()), 1600);
      return () => clearTimeout(t);
    }
  }, [entries]);

  const offline =
    typeof navigator !== 'undefined' && !navigator.onLine && entries.length === 0;

  return (
    <div className={`flex h-full min-h-0 flex-col ${className || ''}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListOrdered size={16} className="text-[#FF2E97]" strokeWidth={2} />
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-[#F2ECFF] sm:text-lg">
            Live virality leaderboard
          </h2>
          {!loading && (
            <Badge
              variant="outline"
              className="border-[#2A1840] font-mono text-[10px] tabular-nums text-[#7A6B94]"
            >
              {entries.length} live
            </Badge>
          )}
        </div>
        <BaseFilterBadge noMatches={noMatches} />
      </div>

      {offline ? (
        <Alert className="border-[#7A6B94]/40 bg-[#7A6B94]/10">
          <WifiOff className="h-4 w-4 text-[#7A6B94]" />
          <AlertTitle className="font-display text-sm text-[#F2ECFF]">
            You&apos;re offline
          </AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-[#7A6B94]">
            Reconnect to resume the live virality stream. Cached data unavailable.
          </AlertDescription>
        </Alert>
      ) : error && entries.length === 0 ? (
        <Alert className="border-[#FF2E97]/40 bg-[#FF2E97]/10">
          <AlertTriangle className="h-4 w-4 text-[#FF2E97]" />
          <AlertTitle className="font-display text-sm text-[#F2ECFF]">
            Stream error
          </AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-[#7A6B94]">
            {error}{' '}
            <button
              onClick={() => refresh()}
              className="font-semibold text-[#FF2E97] underline-offset-2 transition-colors hover:underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      ) : loading && entries.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-[72px] w-full rounded-xl bg-[#2A1840]/60"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
          <div className="flex items-center justify-center gap-2 pt-2 text-[#7A6B94]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Scoring tokens…
            </span>
          </div>
        </div>
      ) : coolingOff || entries.length === 0 ? (
        <CoolingOffState onSelectToken={onSelectToken} />
      ) : (
        <ScrollArea className="min-h-0 flex-1 pr-2">
          <motion.div layout className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <TokenRow
                  key={entry.id}
                  entry={entry}
                  selected={
                    !!selectedAddress &&
                    entry.token_address.toLowerCase() ===
                      selectedAddress.toLowerCase()
                  }
                  isNew={newIds.has(entry.id)}
                  onSelect={onSelectToken}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          {isExample && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]"
            >
              Showing labeled example tokens — live verified Base data replaces these
              as the pipeline runs.
            </motion.p>
          )}
        </ScrollArea>
      )}
    </div>
  );
}

export default Leaderboard;
