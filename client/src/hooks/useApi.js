import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

/** Small GET helper with loading / error state and a reload function. */
export default function useApi(url, { params, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    if (!enabled || !url) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get(url, { params: JSON.parse(paramsKey), signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.name !== 'CanceledError') setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, paramsKey, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { data, loading, error, reload, setData };
}
