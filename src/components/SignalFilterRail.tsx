// Left rail of live signal filters: Base-locked (always on), virality threshold,
// social/onchain weight balance (magenta vs cyan), min liquidity, verified-only,
// sort mode. Drives leaderboard query params via the zustand filter store.
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  Lock,
  Zap,
  Layers,
  Droplets,
  ShieldCheck,
  ArrowDownWideNarrow,
  RotateCcw,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFilterStore, type SortMode } from '../hooks/useFilterStore';
import { formatCompactUsd } from '../lib/formatMetrics';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'virality', label: 'Virality score' },
  { value: 'engagement', label: 'Engagement velocity' },
  { value: 'volume_spike', label: 'Volume spike' },
  { value: 'new_holders', label: 'New holders' },
];

const LIQ_STEPS = [0, 10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

export function SignalFilterRail({ className }: { className?: string }) {
  const viralityThreshold = useFilterStore((s) => s.viralityThreshold);
  const socialWeight = useFilterStore((s) => s.socialWeight);
  const minLiquidity = useFilterStore((s) => s.minLiquidity);
  const verifiedOnly = useFilterStore((s) => s.verifiedOnly);
  const sortMode = useFilterStore((s) => s.sortMode);
  const setViralityThreshold = useFilterStore((s) => s.setViralityThreshold);
  const setSocialWeight = useFilterStore((s) => s.setSocialWeight);
  const setMinLiquidity = useFilterStore((s) => s.setMinLiquidity);
  const setVerifiedOnly = useFilterStore((s) => s.setVerifiedOnly);
  const setSortMode = useFilterStore((s) => s.setSortMode);
  const reset = useFilterStore((s) => s.reset);

  const socialPct = Math.round(socialWeight * 100);
  const onchainPct = 100 - socialPct;
  const liqIndex = Math.max(
    0,
    LIQ_STEPS.findIndex((v) => v === minLiquidity),
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col gap-4 ${className || ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#C56BFF]">
          <SlidersHorizontal size={13} strokeWidth={2} /> Signal filters
        </span>
        <button
          onClick={reset}
          className="flex items-center gap-1 rounded-md border border-[#2A1840] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#7A6B94] transition-all duration-200 hover:border-[#C56BFF]/40 hover:text-[#F2ECFF]"
        >
          <RotateCcw size={10} /> Reset
        </button>
      </div>

      {/* Base locked */}
      <div className="flex items-center justify-between rounded-lg border border-[#1FE0C8]/30 bg-[#1FE0C8]/8 px-3 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[11px] text-[#1FE0C8]">
          <Lock size={13} strokeWidth={2} />
          Base chain only
        </span>
        <Badge className="border-[#1FE0C8]/40 bg-[#1FE0C8]/15 font-mono text-[9px] uppercase tracking-wider text-[#1FE0C8]">
          Locked
        </Badge>
      </div>

      <Separator className="bg-[#2A1840]" />

      {/* Virality threshold */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
            <Zap size={12} className="text-[#FF2E97]" /> Virality threshold
          </Label>
          <span className="font-mono text-sm font-bold tabular-nums text-[#F2ECFF]">
            {viralityThreshold}
          </span>
        </div>
        <Slider
          value={[viralityThreshold]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => setViralityThreshold(v[0])}
          className="[&_[role=slider]]:border-[#FF2E97] [&_[role=slider]]:bg-[#FF2E97]"
        />
        <p className="font-mono text-[10px] text-[#7A6B94]">
          Hide tokens scoring below {viralityThreshold}
        </p>
      </div>

      <Separator className="bg-[#2A1840]" />

      {/* Signal weight balance */}
      <div className="space-y-2.5">
        <Label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
          <Layers size={12} /> Signal balance
        </Label>
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
          <span className="text-[#FF2E97]">Social {socialPct}%</span>
          <span className="text-[#1FE0C8]">{onchainPct}% Onchain</span>
        </div>
        <div className="relative">
          <div
            className="mb-1.5 h-1.5 overflow-hidden rounded-full"
            style={{
              background: `linear-gradient(90deg, #FF2E97 ${socialPct}%, #1FE0C8 ${socialPct}%)`,
            }}
          />
          <Slider
            value={[socialPct]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => setSocialWeight(v[0] / 100)}
            className="[&_[role=slider]]:border-[#C56BFF] [&_[role=slider]]:bg-[#C56BFF]"
          />
        </div>
        <p className="font-mono text-[10px] text-[#7A6B94]">
          How much social hype vs onchain action drives the score
        </p>
      </div>

      <Separator className="bg-[#2A1840]" />

      {/* Min liquidity */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
            <Droplets size={12} className="text-[#1FE0C8]" /> Min liquidity
          </Label>
          <span className="font-mono text-sm font-bold tabular-nums text-[#F2ECFF]">
            {minLiquidity === 0 ? 'Any' : formatCompactUsd(minLiquidity)}
          </span>
        </div>
        <Slider
          value={[liqIndex]}
          min={0}
          max={LIQ_STEPS.length - 1}
          step={1}
          onValueChange={(v) => setMinLiquidity(LIQ_STEPS[v[0]])}
          className="[&_[role=slider]]:border-[#1FE0C8] [&_[role=slider]]:bg-[#1FE0C8]"
        />
      </div>

      <Separator className="bg-[#2A1840]" />

      {/* Verified only */}
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between">
              <Label className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
                <ShieldCheck size={12} className="text-[#1FE0C8]" /> Verified only
              </Label>
              <Switch
                checked={verifiedOnly}
                onCheckedChange={setVerifiedOnly}
                className="data-[state=checked]:bg-[#1FE0C8]"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] border-[#1FE0C8]/30 bg-[#0A0612] text-[#F2ECFF]">
            <p className="text-xs leading-relaxed">
              Only show DexScreener-verified Base tokens. Hides example rows.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator className="bg-[#2A1840]" />

      {/* Sort mode */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
          <ArrowDownWideNarrow size={12} /> Sort by
        </Label>
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="h-10 border-[#2A1840] bg-[#0A0612] font-mono text-xs text-[#F2ECFF] transition-all duration-200 hover:border-[#C56BFF]/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#2A1840] bg-[#14091F] text-[#F2ECFF]">
            {SORT_OPTIONS.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="font-mono text-xs focus:bg-[#C56BFF]/15 focus:text-[#F2ECFF]"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}

export default SignalFilterRail;
