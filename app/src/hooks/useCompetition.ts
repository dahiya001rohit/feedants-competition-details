import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, ApiError, type CompetitionDetails } from '../api';
import { useSession } from '../session';

// Spots and state change as other users register, so refresh while the screen is visible.
// ponytail: polling; switch to SSE/WebSocket pushes if 15s staleness ever matters.
const POLL_MS = 15_000;

export function useCompetition(id: string) {
  const { lang, user } = useSession();
  const [data, setData] = useState<CompetitionDetails | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clockOffset, setClockOffset] = useState(0); // server time - device time

  // Responses can arrive out of order (a slow poll after a registration). Only apply newer ones.
  const seq = useRef(0);
  const applied = useRef(0);
  const accept = useCallback((d: CompetitionDetails, reqId: number) => {
    if (reqId < applied.current) return;
    applied.current = reqId;
    setData(d);
    setError(null);
    setClockOffset(Date.parse(d.serverTime) - Date.now());
  }, []);

  const load = useCallback(async () => {
    const reqId = ++seq.current;
    try {
      accept(await api.competition(id, lang), reqId);
    } catch (e) {
      if (reqId >= applied.current) setError(e as ApiError);
    }
    // user is a dependency so switching accounts refetches viewer state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, lang, user?.id, accept]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => AppState.currentState === 'active' && load(), POLL_MS);
      const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
      return () => {
        clearInterval(timer);
        sub.remove();
      };
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Mutations return the fresh details payload; it supersedes any poll still in flight.
  const mutate = useCallback(
    async (fn: () => Promise<CompetitionDetails>) => accept(await fn(), ++seq.current),
    [accept],
  );

  return { data, error, refreshing, refresh, reload: load, mutate, clockOffset };
}
