// Full drill-down route (/token/:address): big ViralityPulse, full historical
// TrendChart, social + onchain panels, score breakdown, contract info,
// DexScreener link, and safety disclaimer.
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Copy,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ViralityPulse } from './ViralityPulse';
import { TrendChart } from './TrendChart';
import { SocialSignalPanel } from './SocialSignalPanel';
import { OnchainMetricsPanel } from './OnchainMetricsPanel';
import { ScoreBreakdown } from './ScoreBreakdown';
import { SafetyDisclaimer } from './SafetyDisclaimer';
import { ConnectionStatusBar } from './ConnectionStatusBar';
import { useTokenDetail } from '../hooks/useTokenDetail';
import { useTokenSnapshots } from '../hooks/useTokenSnapshots';
import { shortAddress, timeAgo } from '../lib/formatMetrics';

export function TokenDetailPage() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { token, loading, error, isExample, verification } = useTokenDetail(address);
  const { sparkline } = useTokenSnapshots(address, '1h');

  function copyAddr() {
    if (!token) return;
    navigator.clipboard?.writeText(token.token_address);
    toast.success('Address copied', {
      style: {
        background: '#14091F',
        color: '#F2ECFF',
        border: '1px solid rgba(31,224,200,0.4)',
      },
    });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0612] text-[#F2ECFF]">
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
            'radial-gradient(120% 60% at 50% -10%, rgba(255,46,151,0.10), transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex items-center justify-between">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-[#2A1840] bg-[#14091F] font-mono text-[11px] text-[#F2ECFF] transition-all duration-200 hover:border-[#FF2E97]/40"
          >
            <ArrowLeft size={14} /> Back to leaderboard
          </Button>
          <ConnectionStatusBar />
        </div>

        {loading && !token ? (
          <div className="flex h-[60vh] items-center justify-center gap-2 text-[#7A6B94]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-sm uppercase tracking-wider">
              Loading token detail…
            </span>
          </div>
        ) : error || !token ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
            <AlertTriangle size={28} className="text-[#FF2E97]" />
            <p className="font-display text-lg font-bold text-[#F2ECFF]">
              {error || 'Token not found'}
            </p>
            <p className="max-w-md font-mono text-xs text-[#7A6B94]">
              This token isn&apos;t in the tracked set or its address could not be
              resolved.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="mt-2 border border-[#FF2E97]/50 bg-[#FF2E97]/20 font-display font-semibold text-[#F2ECFF] hover:bg-[#FF2E97]/30"
            >
              Back to leaderboard
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* header */}
            <Card className="relative overflow-hidden border-[#FF2E97]/25 bg-[#14091F]/80 p-5">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, #FF2E97, #C56BFF, #1FE0C8)',
                }}
              />
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                <ViralityPulse
                  viralityScore={token.virality_score}
                  socialScore={token.social_score}
                  onchainScore={token.onchain_score}
                  engagementVelocity={token.engagement_velocity}
                  sparkline={sparkline}
                  size={128}
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="font-display text-2xl font-bold text-[#F2ECFF] sm:text-3xl">
                      ${token.symbol || '???'}
                    </h1>
                    {token.verified && (
                      <Badge className="border-[#1FE0C8]/40 bg-[#1FE0C8]/12 font-mono text-[10px] uppercase tracking-wider text-[#1FE0C8]">
                        <ShieldCheck size={11} className="mr-1" /> Base verified
                      </Badge>
                    )}
                    {isExample && (
                      <Badge className="border-[#7A6B94]/30 bg-[#7A6B94]/10 font-mono text-[10px] uppercase tracking-wider text-[#7A6B94]">
                        example
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 font-sans text-sm text-[#7A6B94]">
                    {token.name || 'Unknown token'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <button
                      onClick={copyAddr}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#2A1840] bg-[#0A0612]/60 px-2.5 py-1.5 font-mono text-[11px] text-[#7A6B94] transition-all duration-200 hover:border-[#1FE0C8]/40 hover:text-[#F2ECFF]"
                    >
                      {shortAddress(token.token_address)} <Copy size={12} />
                    </button>
                    {token.dex_url && (
                      <a
                        href={token.dex_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#1FE0C8]/30 bg-[#1FE0C8]/10 px-2.5 py-1.5 font-mono text-[11px] text-[#1FE0C8] transition-all duration-200 hover:border-[#1FE0C8]/60 hover:bg-[#1FE0C8]/20"
                      >
                        DexScreener <ExternalLink size={12} />
                      </a>
                    )}
                    <a
                      href={`https://basescan.org/token/${token.token_address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#7A6B94]/30 bg-[#0A0612]/60 px-2.5 py-1.5 font-mono text-[11px] text-[#7A6B94] transition-all duration-200 hover:border-[#F2ECFF]/40 hover:text-[#F2ECFF]"
                    >
                      Basescan <ExternalLink size={12} />
                    </a>
                  </div>
                  {verification?.warning && (
                    <p className="mt-2 font-mono text-[10px] leading-snug text-[#7A6B94]">
                      {verification.warning}
                    </p>
                  )}
                  <p className="mt-1.5 font-mono text-[10px] text-[#7A6B94]">
                    Updated {token.updated_at ? timeAgo(token.updated_at) : 'live'}
                  </p>
                </div>
              </div>
            </Card>

            <TrendChart tokenIdOrAddress={token.token_address} />

            {/* analytics tabs (mobile) / grid (desktop) */}
            <div className="lg:hidden">
              <Tabs defaultValue="score">
                <TabsList className="grid w-full grid-cols-3 border border-[#2A1840] bg-[#14091F]">
                  <TabsTrigger
                    value="score"
                    className="font-mono text-[11px] data-[state=active]:bg-[#C56BFF]/15 data-[state=active]:text-[#F2ECFF]"
                  >
                    Score
                  </TabsTrigger>
                  <TabsTrigger
                    value="social"
                    className="font-mono text-[11px] data-[state=active]:bg-[#FF2E97]/15 data-[state=active]:text-[#F2ECFF]"
                  >
                    Social
                  </TabsTrigger>
                  <TabsTrigger
                    value="onchain"
                    className="font-mono text-[11px] data-[state=active]:bg-[#1FE0C8]/15 data-[state=active]:text-[#F2ECFF]"
                  >
                    Onchain
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="score" className="mt-3">
                  <ScoreBreakdown
                    socialScore={token.social_score}
                    onchainScore={token.onchain_score}
                    engagementVelocity={token.engagement_velocity}
                    updatedAt={token.updated_at}
                  />
                </TabsContent>
                <TabsContent value="social" className="mt-3">
                  <SocialSignalPanel
                    metrics={{
                      mention_count_1h: token.mention_count_1h,
                      mention_change_pct: token.mention_change_pct,
                      engagement_velocity: token.engagement_velocity,
                      twitter_query: token.twitter_query,
                    }}
                    socialScore={token.social_score}
                    symbol={token.symbol}
                  />
                </TabsContent>
                <TabsContent value="onchain" className="mt-3">
                  <OnchainMetricsPanel
                    metrics={{
                      volume_spike_pct: token.volume_spike_pct,
                      volume_24h: token.volume_24h,
                      new_holders_1h: token.new_holders_1h,
                      holder_count: token.holder_count,
                      tx_count_1h: token.tx_count_1h,
                      liquidity_usd: token.liquidity_usd,
                      market_cap: token.market_cap,
                      price_usd: token.price_usd,
                      dex_url: token.dex_url,
                      token_address: token.token_address,
                    }}
                    onchainScore={token.onchain_score}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="hidden gap-4 lg:grid lg:grid-cols-3">
              <ScoreBreakdown
                socialScore={token.social_score}
                onchainScore={token.onchain_score}
                engagementVelocity={token.engagement_velocity}
                updatedAt={token.updated_at}
              />
              <SocialSignalPanel
                metrics={{
                  mention_count_1h: token.mention_count_1h,
                  mention_change_pct: token.mention_change_pct,
                  engagement_velocity: token.engagement_velocity,
                  twitter_query: token.twitter_query,
                }}
                socialScore={token.social_score}
                symbol={token.symbol}
              />
              <OnchainMetricsPanel
                metrics={{
                  volume_spike_pct: token.volume_spike_pct,
                  volume_24h: token.volume_24h,
                  new_holders_1h: token.new_holders_1h,
                  holder_count: token.holder_count,
                  tx_count_1h: token.tx_count_1h,
                  liquidity_usd: token.liquidity_usd,
                  market_cap: token.market_cap,
                  price_usd: token.price_usd,
                  dex_url: token.dex_url,
                  token_address: token.token_address,
                }}
                onchainScore={token.onchain_score}
              />
            </div>

            <Separator className="bg-[#2A1840]" />
            <SafetyDisclaimer />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default TokenDetailPage;
