import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { useTokenSnapshots } from '../hooks/useTokenSnapshots';
import { formatCompact, formatSignedPercent, formatInt } from '../lib/formatMetrics';

const MAGENTA = '#FF2E97';
const CYAN = '#1FE0C8';

interface RowMiniDashboardProps {
  tokenIdOrAddress: string | null | undefined;
  className?: string;
}

export function RowMiniDashboard({ tokenIdOrAddress, className }: RowMiniDashboardProps) {
  const { snapshots, loading, isExample } = useTokenSnapshots(tokenIdOrAddress, '1h');

  const mentionSeries = useMemo(
    () =>
      snapshots.slice(-40).map((s, i) => ({
        i,
        v: Number(s.mention_count_1h ?? 0),
      })),
    [snapshots],
  );

  const volumeSeries = useMemo(
    () =>
      snapshots.slice(-20).map((s, i) => ({
        i,
        v: Number(s.volume_spike_pct ?? 0),
      })),
    [snapshots],
  );

  const latest = snapshots[snapshots.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`overflow-hidden ${className || ''}`}
    >
      <div className="rounded-lg border border-[#2A1840] bg-[#0A0612]/70 p-3">
        {loading && snapshots.length === 0 ? (
          <div className="flex h-24 items-center justify-center gap-2 text-[#7A6B94]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Loading telemetry…</span>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex h-24 items-center justify-center font-mono text-[11px] text-[#7A6B94]">
            No recent activity
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3 w-3" style={{ color: MAGENTA }} strokeWidth={2} />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: MAGENTA }}>
                  Mention velocity
                </span>
              </div>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mentionSeries} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                    <defs>
                      <linearGradient id="miniMag" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAGENTA} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={MAGENTA} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={MAGENTA}
                      strokeWidth={1.5}
                      fill="url(#miniMag)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" style={{ color: CYAN }} strokeWidth={2} />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: CYAN }}>
                  Volume spike
                </span>
              </div>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeSeries} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                    <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {volumeSeries.map((d, i) => (
                        <Cell key={i} fill={d.v >= 0 ? CYAN : '#7A6B94'} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {latest && (
          <>
            <Separator className="my-2.5 bg-[#2A1840]" />
            <div className="flex flex-wrap items-center gap-2">
              <StatChip label="mentions/hr" value={formatInt(latest.mention_count_1h)} color={MAGENTA} />
              <StatChip label="Δmentions" value={formatSignedPercent(latest.mention_change_pct)} color={MAGENTA} />
              <StatChip label="vol spike" value={formatSignedPercent(latest.volume_spike_pct)} color={CYAN} />
              <StatChip label="new holders" value={`+${formatCompact(latest.new_holders_1h)}`} color={CYAN} />
              <StatChip label="tx/hr" value={formatCompact(latest.tx_count_1h)} color={CYAN} />
              {isExample && (
                <span className="ml-auto rounded border border-[#7A6B94]/30 bg-[#7A6B94]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">
                  example
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-all duration-200"
      style={{ borderColor: `${color}33`, background: `${color}0d` }}
    >
      <span className="font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">{label}</span>
      <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default RowMiniDashboard;
