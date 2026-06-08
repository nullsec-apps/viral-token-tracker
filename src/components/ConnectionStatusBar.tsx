// Live pulse indicator for realtime/socket health + last-refresh tick.
// Surfaces offline / rate-limited states with a neon status dot.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Gauge, Activity, AlertOctagon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTokenSources } from '../hooks/useTokenSources';
import { timeAgo } from '../lib/formatMetrics';

type Status = 'live' | 'connecting' | 'offline' | 'rate-limited';

function useOnline(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

const STATUS_META: Record<
  Status,
  { color: string; label: string; Icon: typeof Wifi }
> = {
  live: { color: '#1FE0C8', label: 'Live', Icon: Activity },
  connecting: { color: '#C56BFF', label: 'Connecting', Icon: Wifi },
  offline: { color: '#7A6B94', label: 'Offline', Icon: WifiOff },
  'rate-limited': { color: '#FF2E97', label: 'Rate limited', Icon: AlertOctagon },
};

export function ConnectionStatusBar({ className }: { className?: string }) {
  const online = useOnline();
  const { health, loading } = useTokenSources();
  const [tick, setTick] = useState(0);

  // re-render the relative time every 10s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);
  void tick;

  let status: Status = 'live';
  if (!online) status = 'offline';
  else if (health.rateLimited) status = 'rate-limited';
  else if (loading) status = 'connecting';

  const meta = STATUS_META[status];
  const { Icon } = meta;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-200 ${className || ''}`}
            style={{
              borderColor: `${meta.color}66`,
              backgroundColor: `${meta.color}14`,
            }}
          >
            <span className="relative flex h-2 w-2">
              {status === 'live' && (
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: meta.color }}
                />
              )}
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
            </span>
            <Icon size={13} style={{ color: meta.color }} strokeWidth={2} />
            <AnimatePresence mode="wait">
              <motion.span
                key={meta.label}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                {meta.label}
              </motion.span>
            </AnimatePresence>
            <span className="hidden font-mono text-[11px] tabular-nums text-[#7A6B94] sm:inline">
              {health.lastRunAt ? `· ${timeAgo(health.lastRunAt)}` : '· awaiting'}
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] border-[#1FE0C8]/30 bg-[#14091F] text-[#F2ECFF]">
          <div className="space-y-1.5 text-xs leading-relaxed">
            <p className="flex items-center gap-1.5 font-semibold">
              <Gauge size={13} style={{ color: meta.color }} />
              Pipeline {meta.label.toLowerCase()}
            </p>
            <p className="text-[#7A6B94]">
              {health.enabledCount} source{health.enabledCount === 1 ? '' : 's'} enabled.
              {health.lastRunAt
                ? ` Last refresh ${timeAgo(health.lastRunAt)}.`
                : ' Awaiting first pipeline run.'}
            </p>
            {status === 'rate-limited' && (
              <p className="text-[#FF2E97]">
                A source is rate-limited — updates may be delayed.
              </p>
            )}
            {status === 'offline' && (
              <p className="text-[#7A6B94]">
                You're offline. Reconnect to resume live updates.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConnectionStatusBar;
