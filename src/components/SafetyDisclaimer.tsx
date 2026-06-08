import { motion } from 'framer-motion';
import { ShieldAlert, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const WARNINGS = [
  'Virality scores are momentum heuristics, not financial advice. High virality often precedes sharp reversals.',
  'Token addresses are verified against DexScreener on Base only — always verify contracts independently before trading.',
  'Only Base chain tokens are tracked. Cross-chain or unverified pairs are filtered out.',
];

interface SafetyDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export function SafetyDisclaimer({ compact = false, className }: SafetyDisclaimerProps) {
  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center gap-2 ${className || ''}`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#FF2E97]/30 bg-[#FF2E97]/10 px-2.5 py-1 transition-all duration-200 hover:border-[#FF2E97]/60 hover:bg-[#FF2E97]/15"
              >
                <ShieldAlert className="h-3 w-3 text-[#FF2E97]" strokeWidth={2} />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF2E97]">
                  Not advice
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs border-[#2A1840] bg-[#14091F] text-[#F2ECFF]">
              <ul className="space-y-1.5">
                {WARNINGS.map((w, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] leading-snug">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-[#FF2E97]" strokeWidth={2} />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </motion.div>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Alert className="border-[#FF2E97]/30 bg-[#FF2E97]/[0.06]">
        <ShieldAlert className="h-4 w-4 text-[#FF2E97]" strokeWidth={2} />
        <AlertDescription className="text-[#F2ECFF]">
          <span className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wider text-[#FF2E97]">
            Read before you ape
          </span>
          <ul className="space-y-1">
            {WARNINGS.map((w, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-[#7A6B94]">
                <span className="select-none text-[#FF2E97]">·</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

export default SafetyDisclaimer;
