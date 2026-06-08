import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart as LineIcon, Loader2, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTokenSnapshots, type SnapshotRange } from '../hooks/useTokenSnapshots';

const MAGENTA = '#FF2E97';
const CYAN = '#1FE0C8';
const PURPLE = '#C56BFF';

const RANGES: { value: SnapshotRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
];

interface TrendChartProps {
  tokenIdOrAddress: string | null | undefined;
  className?: string;
}

function fmtTime(iso: string, range: SnapshotRange): string {
  const d = new Date(iso);
  if (range === '7d' || range === '24h') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function TrendChart({ tokenIdOrAddress, className }: TrendChartProps) {
  const [range, setRange] = useState<SnapshotRange>('1h');
  const { snapshots, loading, error, isExample } = useTokenSnapshots(tokenIdOrAddress, range);

  const data = useMemo(
    () =>
      snapshots.map((s) => ({
        t: fmtTime(s.created_at, range),
        virality: Number(s.virality_score ?? 0),
        mentions: Number(s.mention_count_1h ?? 0),
        volSpike: Number(s.volume_spike_pct ?? 0),
      })),
    [snapshots, range],
  );

  const tickInterval = useMemo(
    () => (data.length > 24 ? Math.floor(data.length / 6) : Math.max(1, Math.floor(data.length / 4))),
    [data.length],
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
            style={{ background: `linear-gradient(90deg, ${MAGENTA}, ${PURPLE}, ${CYAN})` }}
          />
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <LineIcon className="h-4 w-4" style={{ color: PURPLE }} strokeWidth={2} />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#F2ECFF]">
                Virality trend
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-[#7A6B94]">
                    <Info className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs border-[#2A1840] bg-[#14091F] text-[11px] text-[#F2ECFF]">
                  Fused virality score over time with mention velocity (magenta) and volume spike (cyan) overlays.
                </TooltipContent>
              </Tooltip>
            </div>
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(v) => v && setRange(v as SnapshotRange)}
              className="justify-start gap-1"
            >
              {RANGES.map((r) => (
                <ToggleGroupItem
                  key={r.value}
                  value={r.value}
                  className="h-7 min-w-[36px] border border-[#2A1840] bg-[#0A0612] px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#7A6B94] transition-all duration-200 data-[state=on]:border-[#C56BFF]/60 data-[state=on]:bg-[#C56BFF]/15 data-[state=on]:text-[#F2ECFF] hover:text-[#F2ECFF]"
                >
                  {r.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-3">
            <Legend color={PURPLE} label="Virality" />
            <Legend color={MAGENTA} label="Mentions/hr" />
            <Legend color={CYAN} label="Vol spike %" />
            {isExample && (
              <span className="ml-auto rounded border border-[#7A6B94]/30 bg-[#7A6B94]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">
                example data
              </span>
            )}
          </div>

          <div className="h-56 w-full">
            {loading && data.length === 0 ? (
              <div className="flex h-full items-center justify-center gap-2 text-[#7A6B94]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-mono text-[11px] uppercase tracking-wider">Loading history…</span>
              </div>
            ) : error && data.length === 0 ? (
              <div className="flex h-full items-center justify-center font-mono text-[11px] text-[#FF2E97]">
                {error}
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-full items-center justify-center font-mono text-[11px] text-[#7A6B94]">
                No snapshots in this range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="trendVir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PURPLE} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A1840" vertical={false} />
                  <XAxis
                    dataKey="t"
                    interval={tickInterval}
                    tick={{ fill: '#7A6B94', fontSize: 9, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#2A1840' }}
                  />
                  <YAxis
                    yAxisId="score"
                    domain={[0, 100]}
                    tick={{ fill: '#7A6B94', fontSize: 9, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <YAxis yAxisId="overlay" hide domain={['auto', 'auto']} />
                  <RTooltip
                    contentStyle={{
                      background: '#14091F',
                      border: '1px solid #2A1840',
                      borderRadius: 8,
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                    labelStyle={{ color: '#7A6B94' }}
                    itemStyle={{ color: '#F2ECFF' }}
                  />
                  <Area
                    yAxisId="score"
                    type="monotone"
                    dataKey="virality"
                    name="Virality"
                    stroke={PURPLE}
                    strokeWidth={2}
                    fill="url(#trendVir)"
                    isAnimationActive={false}
                    dot={false}
                  />
                  <Line
                    yAxisId="overlay"
                    type="monotone"
                    dataKey="mentions"
                    name="Mentions/hr"
                    stroke={MAGENTA}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="overlay"
                    type="monotone"
                    dataKey="volSpike"
                    name="Vol spike %"
                    stroke={CYAN}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]">{label}</span>
    </span>
  );
}

export default TrendChart;
