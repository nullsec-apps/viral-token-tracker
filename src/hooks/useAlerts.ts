// CRUD + realtime for virality threshold alerts in app_{projectId}_alerts.
import { useCallback, useEffect, useState } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';

function projectId(): string {
  try {
    // @ts-ignore
    return (window.__NULLSEC__ && window.__NULLSEC__.projectId) || 'demo';
  } catch {
    return 'demo';
  }
}
function table(): string {
  return `app_${projectId()}_alerts`;
}

export type AlertType = 'virality_threshold' | 'volume_spike' | 'mention_spike' | 'new_holders';

export interface AlertRow {
  id: string;
  token_address: string | null;
  alert_type: AlertType;
  threshold: number | null;
  condition: Record<string, unknown> | null;
  triggered: boolean | null;
  triggered_at: string | null;
  message: string | null;
  created_at: string;
}

export interface NewAlertInput {
  token_address?: string | null;
  alert_type: AlertType;
  threshold?: number | null;
  condition?: Record<string, unknown> | null;
  message?: string | null;
}

export interface UseAlertsResult {
  alerts: AlertRow[];
  triggered: AlertRow[];
  loading: boolean;
  error: string | null;
  createAlert: (input: NewAlertInput) => Promise<AlertRow | null>;
  removeAlert: (id: string) => Promise<void>;
  toggleTriggered: (id: string, triggered: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAlerts(): UseAlertsResult {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from(table())
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (e) throw e;
      setAlerts((data as AlertRow[]) || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsub = subscribeToTable(
      'alerts',
      (payload: any) => {
        const row = (payload.new || payload.old) as AlertRow;
        if (!row) return;
        setAlerts((prev) => {
          if (payload.eventType === 'DELETE') {
            return prev.filter((a) => a.id !== row.id);
          }
          const idx = prev.findIndex((a) => a.id === row.id);
          if (idx === -1) return [row, ...prev];
          const next = [...prev];
          next[idx] = { ...next[idx], ...row };
          return next;
        });
      },
      { event: '*' },
    );
    return unsub;
  }, []);

  const createAlert = useCallback(async (input: NewAlertInput): Promise<AlertRow | null> => {
    try {
      const payload = {
        token_address: input.token_address ?? null,
        alert_type: input.alert_type,
        threshold: input.threshold ?? null,
        condition: input.condition ?? null,
        triggered: false,
        message: input.message ?? null,
      };
      const { data, error: e } = await supabase
        .from(table())
        .insert(payload)
        .select()
        .single();
      if (e) throw e;
      const row = data as AlertRow;
      setAlerts((prev) => (prev.some((a) => a.id === row.id) ? prev : [row, ...prev]));
      return row;
    } catch (err: any) {
      setError(err?.message || 'Failed to create alert');
      return null;
    }
  }, []);

  const removeAlert = useCallback(async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await supabase.from(table()).delete().eq('id', id);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove alert');
    }
  }, []);

  const toggleTriggered = useCallback(async (id: string, triggered: boolean) => {
    try {
      await supabase
        .from(table())
        .update({ triggered, triggered_at: triggered ? new Date().toISOString() : null })
        .eq('id', id);
    } catch (err: any) {
      setError(err?.message || 'Failed to update alert');
    }
  }, []);

  const triggered = alerts.filter((a) => a.triggered);

  return { alerts, triggered, loading, error, createAlert, removeAlert, toggleTriggered, refresh };
}
