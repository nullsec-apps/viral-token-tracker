// Empty-state strategy: when no tokens cross the virality threshold, show the
// 3 most-watched fading tokens, the MarketVelocityGauge, and an alert
// threshold-slider prompt — never a blank list.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Snowflake, BellPlus, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { MarketVelocityGauge } from './MarketVelocityGauge';
import { ViralityPulse } from './ViralityPulse';
import { useTrackedTokens } from '../hooks/useTrackedTokens';
import { useAlerts } from '../hooks/useAlerts';
import { formatSignedPercent, timeAgo } from '../lib/formatMetrics';

interface CoolingOffStateProps {
  onSelectToken?: (address: string) => void;
  className?: string;
}

export function CoolingOffState({ onSelectToken, className }: CoolingOffStateProps) {
  const { fadingTokens, loading } = useTrackedTokens();
  const { createAlert } = useAlerts();
  const [threshold, setThreshold] = useState(70);
  const [saving, setSaving] = useState(false);

  async function handleSetAlert() {
    setSaving(true);
    const row = await createAlert({
      alert_type: 'virality_threshold',
      threshold,
      message: `Notify when any Base token crosses virality ${threshold}`,
    });
    setSaving(false);
    if (row) {
      toast.success(`Alert set — pinging you at virality ${threshold}`, {
        style: {
          background: '#14091F',
          color: '#F2ECFF',
          border: '1px solid rgba(255,46,151,0.4)',
        },
      });
    } else {
      toast.error('Could not set alert');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`flex flex-col gap-5 ${className || ''}`}
    >
      <div className="flex flex-col items-center gap-2 rounded-xl border border-[#7A6B94]/20 bg-[#14091F]/60 px-6 py-8 text-center">
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1FE0C8]/30 bg-[#1FE0C8]/8 text-[#1FE0C8]"
        >
          <Snowflake size={22} strokeWidth={1.5} />
        </motion.span>
        <h2 className="mt-1 font-display text-xl font-bold text-[#F2ECFF] sm:text-2xl">
          Cooling off
        </h2>
        <p className="max-w-md font-sans text-sm leading-relaxed text-[#7A6B94]">
          No Base tokens are crossing your virality threshold right now. Lower the
          threshold in the filters, or set an alert and we&apos;ll ping you the
          moment the next spike hits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr,minmax(0,300px)]">
        {/* Fading tokens */}
        <Card className="border-[#7A6B94]/20 bg-[#14091F]/80 p-4">
          <div className="mb-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#7A6B94]">
            <TrendingDown size={13} /> Most-watched · fading
          </div>
          {loading && fadingTokens.length === 0 ? (
            <div className="flex h-32 items-center justify-center gap-2 text-[#7A6B94]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Loading…
              </span>
            </div>
          ) : fadingTokens.length === 0 ? (
            <div className="flex h-32 items-center justify-center font-mono text-[11px] text-[#7A6B94]">
              No recently-tracked tokens yet
            </div>
          ) : (
            <div className="space-y-2">
              {fadingTokens.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                  onClick={() => onSelectToken?.(t.token_address)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-[#2A1840] bg-[#0A0612]/60 p-2.5 text-left transition-all duration-200 hover:border-[#FF2E97]/40 hover:bg-[#0A0612]"
                >
                  <ViralityPulse
                    viralityScore={t.virality_score}
                    socialScore={t.social_score}
                    onchainScore={t.onchain_score}
                    engagementVelocity={t.engagement_velocity * 0.4}
                    size={48}
                    showLabel={false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-[#F2ECFF]">
                        ${t.symbol || '???'}
                      </span>
                      {t.is_example && (
                        <Badge className="border-[#7A6B94]/30 bg-[#7A6B94]/10 font-mono text-[9px] uppercase tracking-wider text-[#7A6B94]">
                          example
                        </Badge>
                      )}
                    </div>
                    <p className="truncate font-mono text-[10px] text-[#7A6B94]">
                      {t.name || 'Unknown'} · seen{' '}
                      {timeAgo(t.updated_at || t.created_at)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[11px] tabular-nums text-[#7A6B94]">
                    {formatSignedPercent(-Math.abs(t.engagement_velocity) * 0.3)}
                    <ArrowRight
                      size={13}
                      className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </Card>

        {/* Market velocity gauge */}
        <MarketVelocityGauge />
      </div>

      {/* Alert prompt */}
      <Card className="border-[#FF2E97]/25 bg-[#14091F]/80 p-4">
        <div className="mb-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#FF2E97]">
          <BellPlus size={13} strokeWidth={2} /> Set an alert for the next spike
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
                Notify at virality
              </Label>
              <span className="font-display text-lg font-bold tabular-nums text-[#FF2E97]">
                {threshold}
              </span>
            </div>
            <Slider
              value={[threshold]}
              min={30}
              max={100}
              step={1}
              onValueChange={(v) => setThreshold(v[0])}
              className="[&_[role=slider]]:border-[#FF2E97] [&_[role=slider]]:bg-[#FF2E97]"
            />
          </div>
          <Button
            onClick={handleSetAlert}
            disabled={saving}
            className="h-11 shrink-0 gap-2 border border-[#FF2E97]/50 bg-[#FF2E97]/20 font-display font-semibold text-[#F2ECFF] transition-all duration-200 hover:bg-[#FF2E97]/30 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <BellPlus size={16} />
            )}
            Set alert
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default CoolingOffState;
