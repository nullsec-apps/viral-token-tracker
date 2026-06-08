// Clearly-labeled example seed data (is_example=true) so the leaderboard,
// score rings, and sparklines render immediately before live data arrives.
// NEVER present these as real live entities — they are momentum placeholders.
import { computeVirality } from './scoring';

export interface ExampleSnapshot {
  created_at: string;
  virality_score: number;
  social_score: number;
  onchain_score: number;
  mention_count_1h: number;
  engagement_velocity: number;
  volume_spike_pct: number;
  new_holders_1h: number;
  tx_count_1h: number;
  volume_24h: number;
  liquidity_usd: number;
  price_usd: number;
}

export interface ExampleToken {
  id: string;
  token_address: string;
  symbol: string;
  name: string;
  dex_url: string;
  pair_address: string;
  twitter_query: string;
  virality_score: number;
  social_score: number;
  onchain_score: number;
  engagement_velocity: number;
  mention_count_1h: number;
  mention_change_pct: number;
  volume_spike_pct: number;
  new_holders_1h: number;
  tx_count_1h: number;
  holder_count: number;
  volume_24h: number;
  liquidity_usd: number;
  market_cap: number;
  fdv: number;
  volume_to_market_cap: number;
  price_usd: number;
  verified: boolean;
  is_example: boolean;
  last_verified_at: string;
  updated_at: string;
  created_at: string;
  sparkline: number[];
}

function buildSparkline(base: number, jitter: number, points = 60): number[] {
  const out: number[] = [];
  let v = Math.max(0, base - jitter * 1.2);
  for (let i = 0; i < points; i++) {
    const drift = (Math.sin(i / 6) + Math.sin(i / 2.3)) * jitter * 0.35;
    const noise = (((i * 9301 + 49297) % 233280) / 233280 - 0.5) * jitter * 0.4;
    v = Math.max(0, Math.min(100, base - jitter + (i / points) * jitter * 1.4 + drift + noise));
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

function buildSnapshots(token: ExampleToken, points = 60): ExampleSnapshot[] {
  const now = Date.now();
  const out: ExampleSnapshot[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 60_000).toISOString();
    const idx = points - 1 - i;
    const ramp = idx / points;
    const vir = token.sparkline[idx] ?? token.virality_score;
    out.push({
      created_at: t,
      virality_score: vir,
      social_score: Number((token.social_score * (0.7 + ramp * 0.3)).toFixed(2)),
      onchain_score: Number((token.onchain_score * (0.75 + ramp * 0.25)).toFixed(2)),
      mention_count_1h: Math.round(token.mention_count_1h * (0.6 + ramp * 0.4)),
      engagement_velocity: Number((token.engagement_velocity * (0.6 + ramp * 0.4)).toFixed(1)),
      volume_spike_pct: Number((token.volume_spike_pct * (0.5 + ramp * 0.5)).toFixed(1)),
      new_holders_1h: Math.round(token.new_holders_1h * (0.5 + ramp * 0.5)),
      tx_count_1h: Math.round(token.tx_count_1h * (0.5 + ramp * 0.5)),
      volume_24h: Math.round(token.volume_24h * (0.85 + ramp * 0.15)),
      liquidity_usd: token.liquidity_usd,
      price_usd: token.price_usd,
    });
  }
  return out;
}

const RAW: Omit<ExampleToken, 'virality_score' | 'social_score' | 'onchain_score' | 'sparkline'>[] = [
  {
    id: 'example-degen',
    token_address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    symbol: 'DEGEN',
    name: 'Degen',
    dex_url: 'https://dexscreener.com/base/0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    pair_address: '0xexamplepairdegen',
    twitter_query: '$DEGEN base',
    engagement_velocity: 312,
    mention_count_1h: 1840,
    mention_change_pct: 312,
    volume_spike_pct: 284,
    new_holders_1h: 1420,
    tx_count_1h: 5210,
    holder_count: 184320,
    volume_24h: 2_100_000,
    liquidity_usd: 1_340_000,
    market_cap: 92_000_000,
    fdv: 110_000_000,
    volume_to_market_cap: 0.022,
    price_usd: 0.0079,
    verified: true,
    is_example: true,
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'example-brett',
    token_address: '0x532f27101965dd16442e59d40670faf5ebb142e4',
    symbol: 'BRETT',
    name: 'Brett',
    dex_url: 'https://dexscreener.com/base/0x532f27101965dd16442e59d40670faf5ebb142e4',
    pair_address: '0xexamplepairbrett',
    twitter_query: '$BRETT base',
    engagement_velocity: 198,
    mention_count_1h: 1210,
    mention_change_pct: 167,
    volume_spike_pct: 142,
    new_holders_1h: 860,
    tx_count_1h: 3120,
    holder_count: 96210,
    volume_24h: 1_420_000,
    liquidity_usd: 980_000,
    market_cap: 64_000_000,
    fdv: 72_000_000,
    volume_to_market_cap: 0.0222,
    price_usd: 0.0641,
    verified: true,
    is_example: true,
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 5_400_000).toISOString(),
  },
  {
    id: 'example-toshi',
    token_address: '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4',
    symbol: 'TOSHI',
    name: 'Toshi',
    dex_url: 'https://dexscreener.com/base/0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4',
    pair_address: '0xexamplepairtoshi',
    twitter_query: '$TOSHI base',
    engagement_velocity: 134,
    mention_count_1h: 740,
    mention_change_pct: 96,
    volume_spike_pct: 88,
    new_holders_1h: 410,
    tx_count_1h: 1980,
    holder_count: 142000,
    volume_24h: 720_000,
    liquidity_usd: 540_000,
    market_cap: 38_000_000,
    fdv: 41_000_000,
    volume_to_market_cap: 0.0189,
    price_usd: 0.00038,
    verified: true,
    is_example: true,
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: 'example-mochi',
    token_address: '0xf6e932ca12afa26665dc4dde7e27be02a7c02e50',
    symbol: 'MOCHI',
    name: 'Mochi',
    dex_url: 'https://dexscreener.com/base/0xf6e932ca12afa26665dc4dde7e27be02a7c02e50',
    pair_address: '0xexamplepairmochi',
    twitter_query: '$MOCHI base',
    engagement_velocity: 76,
    mention_count_1h: 420,
    mention_change_pct: 52,
    volume_spike_pct: 61,
    new_holders_1h: 240,
    tx_count_1h: 1120,
    holder_count: 58300,
    volume_24h: 410_000,
    liquidity_usd: 320_000,
    market_cap: 18_000_000,
    fdv: 19_500_000,
    volume_to_market_cap: 0.0228,
    price_usd: 0.00000041,
    verified: true,
    is_example: true,
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 9_000_000).toISOString(),
  },
  {
    id: 'example-keycat',
    token_address: '0x9a26f5433671751c3276a065f57e5a02d2817973',
    symbol: 'KEYCAT',
    name: 'Keyboard Cat',
    dex_url: 'https://dexscreener.com/base/0x9a26f5433671751c3276a065f57e5a02d2817973',
    pair_address: '0xexamplepairkeycat',
    twitter_query: '$KEYCAT base',
    engagement_velocity: 48,
    mention_count_1h: 280,
    mention_change_pct: 31,
    volume_spike_pct: 44,
    new_holders_1h: 130,
    tx_count_1h: 690,
    holder_count: 41200,
    volume_24h: 280_000,
    liquidity_usd: 210_000,
    market_cap: 11_000_000,
    fdv: 12_000_000,
    volume_to_market_cap: 0.0254,
    price_usd: 0.0011,
    verified: true,
    is_example: true,
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 10_800_000).toISOString(),
  },
];

export const EXAMPLE_TOKENS: ExampleToken[] = RAW.map((r) => {
  const result = computeVirality(
    {
      mention_count_1h: r.mention_count_1h,
      mention_change_pct: r.mention_change_pct,
      engagement_velocity: r.engagement_velocity,
    },
    {
      volume_spike_pct: r.volume_spike_pct,
      volume_24h: r.volume_24h,
      new_holders_1h: r.new_holders_1h,
      tx_count_1h: r.tx_count_1h,
      liquidity_usd: r.liquidity_usd,
      volume_to_market_cap: r.volume_to_market_cap,
    },
  );
  const token: ExampleToken = {
    ...r,
    virality_score: result.virality_score,
    social_score: result.social_score,
    onchain_score: result.onchain_score,
    sparkline: buildSparkline(result.virality_score, 22),
  };
  return token;
}).sort((a, b) => b.virality_score - a.virality_score);

export function exampleSnapshotsFor(token: ExampleToken, points = 60): ExampleSnapshot[] {
  return buildSnapshots(token, points);
}

export function findExampleToken(address: string): ExampleToken | undefined {
  const a = (address || '').toLowerCase();
  return EXAMPLE_TOKENS.find((t) => t.token_address.toLowerCase() === a || t.id === address);
}

export function exampleMarketVelocity(): { mentionsPerHour: number; engagementVelocity: number; tokenCount: number } {
  const mentionsPerHour = EXAMPLE_TOKENS.reduce((s, t) => s + t.mention_count_1h, 0);
  const engagementVelocity = EXAMPLE_TOKENS.reduce((s, t) => s + t.engagement_velocity, 0);
  return { mentionsPerHour, engagementVelocity, tokenCount: EXAMPLE_TOKENS.length };
}
