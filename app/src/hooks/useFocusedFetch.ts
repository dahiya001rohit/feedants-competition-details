import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Loads whenever the screen comes into view, so lists reflect actions taken on other screens.
// `fetcher` must be memoized (useCallback) by the caller.
export function useFocusedFetch<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await fetcher());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [fetcher]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { data, failed, refreshing, refresh, reload: load };
}
