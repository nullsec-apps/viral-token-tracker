// Tabular monospaced number formatting for the synthwave trading terminal.
// Social signals glow magenta (#FF2E97), onchain signals glow cyan (#1FE0C8).

export const COLORS = {
  accent: '#FF2E97',
  accent2: '#1FE0C8',
  bg: '#0A0612',
  surface: '#14091F',
  text: '#F2ECFF',
  muted: '#7A6B94',
} as const;

export type SignalKind = 'social' | 'onchain' | 'fused' | 'neutral';

export function signalColor(kind: SignalKind): string {
  switch (kind) {
    case 'social': return COLORS.accent;
    case 'onchain': return COLORS.accent2;
    case 'fused': return '#C56BFF';
    default: return COLORS.text;
  }
}

function safeNum(n: number | null | undefined): number {
  if (n === null || n === undefined || Number.isNaN(Number(n)) || !Number.isFinite(Number(n))) return 0;
  return Number(n);
}

export function formatCompactUsd(value: number | null | undefined): string {
  const n = safeNum(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;
  if (abs === 0) return '$0';
  return `${sign}$${abs.toPrecision(2)}`;
}

export function formatPrice(value: number | null | undefined): string {
  const n = safeNum(value);
  if (n === 0) return '$0.00';
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  // show subscript-ish notation for tiny prices
  const str = n.toFixed(12).replace(/0+$/, '');
  return `$${str}`;
}

export function formatCompact(value: number | null | undefined): string {
  const n = safeNum(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${Math.round(abs)}`;
}

export function formatInt(value: number | null | undefined): string {
  const n = Math.round(safeNum(value));
  return n.toLocaleString('en-US');
}

export function formatSignedCompact(value: number | null | undefined): string {
  const n = safeNum(value);
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${formatCompact(n)}`;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  const n = safeNum(value);
  return `${n.toFixed(decimals)}%`;
}

export function formatSignedPercent(value: number | null | undefined, decimals = 1): string {
  const n = safeNum(value);
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(decimals)}%`;
}

export type Direction = 'up' | 'down' | 'flat';

export function directionOf(value: number | null | undefined, threshold = 0): Direction {
  const n = safeNum(value);
  if (n > threshold) return 'up';
  if (n < -threshold) return 'down';
  return 'flat';
}

export function arrowGlyph(dir: Direction): string {
  switch (dir) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
}

export function directionColor(dir: Direction, kind: SignalKind = 'neutral'): string {
  if (dir === 'flat') return COLORS.muted;
  if (dir === 'down') return '#7A6B94';
  return signalColor(kind);
}

export function shortAddress(addr: string | null | undefined): string {
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function timeAgo(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '—';
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
