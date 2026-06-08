// Create + manage virality threshold alerts with sliders and a condition
// builder. Lists triggered alerts in real time via the alerts realtime channel.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  Zap,
  TrendingUp,
  Users,
  Megaphone,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlerts, type AlertType } from '../hooks/useAlerts';
import { shortAddress, timeAgo } from '../lib/formatMetrics';

const ALERT_TYPES: { value: AlertType; label: string; icon: typeof Zap; color: string; unit: string; max: number; defaultVal: number }[] = [
  { value: 'virality_threshold', label: 'Virality score', icon: Zap, color: '#C56BFF', unit: 'score', max: 100, defaultVal: 80 },
  { value: 'volume_spike', label: 'Volume spike', icon: TrendingUp, color: '#1FE0C8', unit: '%', max: 1000, defaultVal: 300 },
  { value: 'mention_spike', label: 'Mention spike', icon: Megaphone, color: '#FF2E97', unit: '%', max: 1000, defaultVal: 200 },
  { value: 'new_holders', label: 'New holders/1h', icon: Users, color: '#1FE0C8', unit: 'holders', max: 5000, defaultVal: 1000 },
];

function typeMeta(t: AlertType) {
  return ALERT_TYPES.find((a) => a.value === t) || ALERT_TYPES[0];
}

export function AlertPanel({ className }: { className?: string }) {
  const { alerts, triggered, loading, error, createAlert, removeAlert } = useAlerts();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AlertType>('virality_threshold');
  const [threshold, setThreshold] = useState(80);
  const [tokenAddr, setTokenAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const meta = typeMeta(type);

  function onTypeChange(t: AlertType) {
    setType(t);
    setThreshold(typeMeta(t).defaultVal);
  }

  async function handleCreate() {
    setSubmitting(true);
    const scope = tokenAddr.trim() ? `$${shortAddress(tokenAddr.trim())}` : 'any token';
    await createAlert({
      alert_type: type,
      threshold,
      token_address: tokenAddr.trim() || null,
      message: `${meta.label} ≥ ${threshold}${meta.unit === '%' ? '%' : ''} on ${scope}`,
    });
    setSubmitting(false);
    setOpen(false);
    setTokenAddr('');
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#C56BFF]">
          <Bell size={14} strokeWidth={2} />
          Spike alerts
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="h-8 gap-1.5 border border-[#C56BFF]/40 bg-[#C56BFF]/15 font-mono text-[11px] text-[#F2ECFF] transition-all duration-200 hover:bg-[#C56BFF]/25"
            >
              <Plus size={13} /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="border-[#C56BFF]/30 bg-[#14091F] text-[#F2ECFF] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2 text-[#F2ECFF]">
                <BellRing size={18} className="text-[#C56BFF]" />
                Set a spike alert
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label className="font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
                  Alert type
                </Label>
                <Select value={type} onValueChange={(v) => onTypeChange(v as AlertType)}>
                  <SelectTrigger className="h-11 border-[#2A1840] bg-[#0A0612] font-mono text-sm text-[#F2ECFF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2A1840] bg-[#14091F] text-[#F2ECFF]">
                    {ALERT_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value} className="font-mono text-sm">
                        <span className="flex items-center gap-2">
                          <a.icon size={13} style={{ color: a.color }} />
                          {a.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
                    Threshold
                  </Label>
                  <span
                    className="font-mono text-lg font-bold tabular-nums"
                    style={{ color: meta.color }}
                  >
                    {threshold}
                    {meta.unit === '%' ? '%' : ''}
                  </span>
                </div>
                <Slider
                  value={[threshold]}
                  min={0}
                  max={meta.max}
                  step={meta.value === 'virality_threshold' ? 1 : 10}
                  onValueChange={(v) => setThreshold(v[0])}
                  className="py-1"
                />
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]">
                  Notify when {meta.label.toLowerCase()} ≥ {threshold}
                  {meta.unit === '%' ? '%' : ` ${meta.unit}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[11px] uppercase tracking-wider text-[#7A6B94]">
                  Token address (optional)
                </Label>
                <Input
                  value={tokenAddr}
                  onChange={(e) => setTokenAddr(e.target.value)}
                  placeholder="0x… — leave blank for market-wide"
                  className="h-11 border-[#2A1840] bg-[#0A0612] font-mono text-sm text-[#F2ECFF] placeholder:text-[#7A6B94]/60"
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="h-11 w-full gap-2 border border-[#C56BFF]/50 bg-[#C56BFF]/20 font-display font-semibold text-[#F2ECFF] transition-all duration-200 hover:bg-[#C56BFF]/30 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />}
                Create alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {triggered.length > 0 && (
        <div className="mb-3 space-y-2">
          <AnimatePresence initial={false}>
            {triggered.slice(0, 3).map((a) => {
              const tm = typeMeta(a.alert_type);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 rounded-lg border border-[#FF2E97]/50 bg-[#FF2E97]/12 px-3 py-2"
                >
                  <BellRing size={14} className="shrink-0 animate-pulse text-[#FF2E97]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[11px] text-[#F2ECFF]">
                      {a.message || `${tm.label} triggered`}
                    </p>
                    <p className="font-mono text-[10px] text-[#7A6B94]">
                      {timeAgo(a.triggered_at || a.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg bg-[#2A1840]" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg border border-[#FF2E97]/30 bg-[#FF2E97]/10 px-3 py-2 font-mono text-[11px] text-[#FF2E97]">
          {error}
        </p>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#7A6B94]/30 bg-[#0A0612]/40 px-3 py-5 text-center">
          <Bell size={20} className="mx-auto mb-1.5 text-[#7A6B94]" strokeWidth={1.5} />
          <p className="font-mono text-[11px] text-[#7A6B94]">
            No alerts yet. Set one to get pinged the next time a token spikes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {alerts.map((a) => {
              const tm = typeMeta(a.alert_type);
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="group flex items-center gap-2 rounded-lg border border-[#2A1840] bg-[#0A0612]/60 px-3 py-2 transition-all duration-200 hover:border-[#C56BFF]/40"
                >
                  <tm.icon size={14} style={{ color: tm.color }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[11px] text-[#F2ECFF]">
                      {tm.label} ≥ {a.threshold ?? '—'}
                      {tm.unit === '%' ? '%' : ''}
                    </p>
                    <p className="truncate font-mono text-[10px] text-[#7A6B94]">
                      {a.token_address ? shortAddress(a.token_address) : 'market-wide'}
                    </p>
                  </div>
                  {a.triggered ? (
                    <Badge className="border-[#FF2E97]/40 bg-[#FF2E97]/15 font-mono text-[10px] text-[#FF2E97]">
                      <CheckCircle2 size={10} className="mr-1" /> hit
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-[#7A6B94]/30 font-mono text-[10px] text-[#7A6B94]"
                    >
                      armed
                    </Badge>
                  )}
                  <button
                    onClick={() => removeAlert(a.id)}
                    className="text-[#7A6B94] opacity-0 transition-all duration-200 hover:text-[#FF2E97] group-hover:opacity-100"
                    aria-label="Remove alert"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default AlertPanel;
