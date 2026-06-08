// Reads the data-source registry (DexScreener, Uniswap subgraph, Twitter
// queries, RPC) and pipeline run status/health from app_{projectId}_token_sources.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function projectId(): string {
  try {
    // @ts-ignore
    return (window.__NULLSEC__ && window.__NULLSEC__.projectId) || 'demo';
  } catch {
    return 'demo';
  }
}
function table(): string {
  return `app_${projectId()}_token_sources`;
}

export type SourceType = 'dexscreener' | 'uniswap_subgraph' | 'twitter' | 'base_rpc' | 'basescan' | string;
export type SourceStatus = 'idle' | 'running' | 'ok' | 'error' | 'rate_limited' | null;

export interface TokenSourceRow {
  id: string;
  name: string;
  source_type: SourceType;
  config: Record<string, unknown> | null;
  enabled: boolean;
  last_run_at: string | null;
  status: SourceStatus;
  created_at: string;
}

export interface PipelineHealth {
  /** Most recent last_run_at across all enabled sources. */
  lastRunAt: string | null;
  /** True if any source reports a rate_limited status. */
  rateLimited: boolean;
  /** True if any enabled source is in error. */
  hasError: boolean;
  /** Count of enabled sources. */
  enabledCount: number;
}

// Fallback registry so the connection status bar + source panel render even
// before the pipeline has written any rows. These describe the real feeds the
// backend pipeline uses — never presented as live token data.
const FALLBACK_SOURCES: TokenSourceRow[] = [
  {
    id: 'src-dexscreener',
    name: 'DexScreener — Base pairs',
    source_type: 'dexscreener',
    config: { chain: 'base' },
    enabled: true,
    last_run_at: null,
    status: 'idle',
    created_at: new Date().toISOString(),
  },
  {
    id: 'src-twitter',
    name: 'X / Twitter — mention search',
    source_type: 'twitter',
    config: { signal: 'social' },
    enabled: true,
    last_run_at: null,
    status: 'idle',
    created_at: new Date().toISOString(),
  },
  {
    id: 'src-base-rpc',
    name: 'Base RPC — tx + holders',
    source_type: 'base_rpc',
    config: { signal: 'onchain' },
    enabled: true,
    last_run_at: null,
    status: 'idle',
    created_at: new Date().toISOString(),
  },
  {
    id: 'src-uniswap',
    name: 'Uniswap V3 — Base volume',
    source_type: 'uniswap_subgraph',
    config: { signal: 'onchain' },
    enabled: true,
    last_run_at: null,
    status: 'idle',
    created_at: new Date().toISOString(),
  },
];

export interface UseTokenSourcesResult {
  sources: TokenSourceRow[];
  health: PipelineHealth;
  loading: boolean;
  error: string | null;
  isFallback: boolean;
  refresh: () => Promise<void>;
}

function computeHealth(sources: TokenSourceRow[]): PipelineHealth {
  const enabled = sources.filter((s) => s.enabled);
  let lastRunAt: string | null = null;
  let rateLimited = false;
  let hasError = false;
  for (const s of enabled) {
    if (s.last_run_at) {
      if (!lastRunAt || new Date(s.last_run_at).getTime() > new Date(lastRunAt).getTime()) {
        lastRunAt = s.last_run_at;
      }
    }
    if (s.status === 'rate_limited') rateLimited = true;
    if (s.status === 'error') hasError = true;
  }
  return { lastRunAt, rateLimited, hasError, enabledCount: enabled.length };
}

export function useTokenSources(): UseTokenSourcesResult {
  const [sources, setSources] = useState<TokenSourceRow[]>(FALLBACK_SOURCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from(table())
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (e) throw e;
      const rows = (data as TokenSourceRow[]) || [];
      if (rows.length > 0) {
        setSources(rows);
        setIsFallback(false);
      } else {
        setSources(FALLBACK_SOURCES);
        setIsFallback(true);
      }
    } catch (err: any) {
      setSources(FALLBACK_SOURCES);
      setIsFallback(true);
      setError(err?.message || 'Failed to load data sources');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { sources, health: computeHealth(sources), loading, error, isFallback, refresh };
}
