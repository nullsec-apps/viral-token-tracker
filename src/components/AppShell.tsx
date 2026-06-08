// Root split command-deck layout: scanline grid backdrop, sticky ticker bar,
// left signal-filter rail, center leaderboard, right telemetry rail. Manages
// selected-token state and mobile bottom-sheet filters + swipe-up telemetry.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Radar, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { HeroTickerStrip } from './HeroTickerStrip';
import { ConnectionStatusBar } from './ConnectionStatusBar';
import { SignalFilterRail } from './SignalFilterRail';
import { MarketVelocityGauge } from './MarketVelocityGauge';
import { Leaderboard } from './Leaderboard';
import { TokenTelemetryRail } from './TokenTelemetryRail';
import { SafetyDisclaimer } from './SafetyDisclaimer';

export function AppShell() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileTelemetry, setMobileTelemetry] = useState(false);

  const logoUrl =
    typeof window !== 'undefined'
      ? (window as any).__NULLSEC__?.logoUrl
      : undefined;

  function handleSelect(address: string) {
    setSelected(address);
    setMobileTelemetry(true);
  }

  function openDetail(address: string) {
    navigate(`/token/${address}`);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0612] text-[#F2ECFF]">
      {/* scanline grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,46,151,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,224,200,0.03) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(120% 60% at 50% -10%, rgba(255,46,151,0.10), transparent 60%), radial-gradient(80% 50% at 100% 100%, rgba(31,224,200,0.06), transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 sm:px-6">
        {/* top bar */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                className="h-8 w-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF2E97] to-[#1FE0C8] font-display text-sm font-bold text-[#0A0612]">
                V
              </span>
            )}
            <div className="leading-none">
              <p className="font-display text-base font-bold tracking-tight text-[#F2ECFF]">
                VIRAL<span className="text-[#FF2E97]">PULSE</span>
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7A6B94]">
                Base virality console
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatusBar />
            <SafetyDisclaimer compact />
            {/* mobile filter sheet trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 border-[#2A1840] bg-[#14091F] font-mono text-[11px] text-[#F2ECFF] transition-all duration-200 hover:border-[#C56BFF]/40 lg:hidden"
                >
                  <SlidersHorizontal size={13} /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] border-[#2A1840] bg-[#0A0612] text-[#F2ECFF]"
              >
                <ScrollArea className="h-full pr-2">
                  <SignalFilterRail className="pt-6" />
                  <Separator className="my-4 bg-[#2A1840]" />
                  <MarketVelocityGauge />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <HeroTickerStrip
          showHero
          onOpenLeaderboard={() => {
            const el = document.getElementById('leaderboard-anchor');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onSelectToken={handleSelect}
          className="mb-4"
        />

        {/* command deck */}
        <main
          id="leaderboard-anchor"
          className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_360px]"
        >
          {/* left rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 flex flex-col gap-4 rounded-xl border border-[#2A1840] bg-[#14091F]/60 p-4">
              <SignalFilterRail />
              <Separator className="bg-[#2A1840]" />
              <MarketVelocityGauge compact />
            </div>
          </aside>

          {/* center stream */}
          <section className="min-w-0">
            <Leaderboard
              selectedAddress={selected}
              onSelectToken={handleSelect}
            />
          </section>

          {/* right telemetry rail (desktop) */}
          <aside className="hidden xl:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] rounded-xl border border-[#2A1840] bg-[#14091F]/60 p-4">
              <TokenTelemetryRail address={selected} onOpenDetail={openDetail} />
            </div>
          </aside>
        </main>

        <footer className="mt-6">
          <SafetyDisclaimer />
        </footer>
      </div>

      {/* mobile / tablet telemetry swipe-up */}
      <Sheet open={mobileTelemetry} onOpenChange={setMobileTelemetry}>
        <SheetContent
          side="bottom"
          className="h-[88vh] border-[#2A1840] bg-[#0A0612] p-0 text-[#F2ECFF] xl:hidden"
        >
          <div className="flex items-center justify-between border-b border-[#2A1840] px-4 py-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#C56BFF]">
              <Radar size={13} /> Telemetry
            </span>
            <button
              onClick={() => setMobileTelemetry(false)}
              className="text-[#7A6B94] transition-colors hover:text-[#F2ECFF]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(88vh-49px)] overflow-hidden px-4 py-4"
          >
            <TokenTelemetryRail address={selected} onOpenDetail={openDetail} />
          </motion.div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AppShell;
