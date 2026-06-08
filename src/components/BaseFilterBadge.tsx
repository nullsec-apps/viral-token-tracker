// Persistent Base-only verified indicator + no-verified-matches surfacing.
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useTrackedTokens } from '../hooks/useTrackedTokens';

interface BaseFilterBadgeProps {
  /** When true, the active filters removed every token. */
  noMatches?: boolean;
  className?: string;
}

export function BaseFilterBadge({ noMatches = false, className }: BaseFilterBadgeProps) {
  const { verifiedCount, hasLiveData } = useTrackedTokens();

  return (
    <div className={className}>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#1FE0C8]/40 bg-[#1FE0C8]/10 px-3 py-1.5 transition-all duration-200 hover:border-[#1FE0C8]/70 hover:bg-[#1FE0C8]/15"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1FE0C8] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1FE0C8]" />
              </span>
              <ShieldCheck size={14} className="text-[#1FE0C8]" strokeWidth={2} />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#1FE0C8]">
                Base verified
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[#7A6B94]">
                {hasLiveData ? `${verifiedCount} live` : 'examples'}
              </span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px] border-[#1FE0C8]/30 bg-[#14091F] text-[#F2ECFF]">
            <p className="flex items-start gap-1.5 text-xs leading-relaxed">
              <Info size={13} className="mt-0.5 shrink-0 text-[#1FE0C8]" />
              Only tokens verified against DexScreener on Base (chainId=base) are
              shown. Cross-chain or unverified pairs are filtered out.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {noMatches && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mt-3"
        >
          <Alert className="border-[#FF2E97]/40 bg-[#FF2E97]/10">
            <AlertTriangle className="h-4 w-4 text-[#FF2E97]" />
            <AlertTitle className="font-display text-sm text-[#F2ECFF]">
              No verified Base matches
            </AlertTitle>
            <AlertDescription className="text-xs leading-relaxed text-[#7A6B94]">
              Your current filters removed every verified Base token. Loosen the
              virality threshold, lower min liquidity, or turn off verified-only
              to widen the stream.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}

export default BaseFilterBadge;
