const INTERVAL_MS = 10 * 60 * 1000;

/**
 * Render's free tier sleeps a service after ~15 minutes without traffic.
 * Render sets RENDER_EXTERNAL_URL automatically, so on Render the API pings its
 * own health endpoint every 10 minutes; locally the variable is absent and this is a no-op.
 */
export function startKeepAlive() {
  const baseUrl = process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) return null;

  const url = `${baseUrl.replace(/\/+$/, '')}/api/health`;

  return setInterval(async () => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      console.log(`[keep-alive] ${res.status}`);
    } catch (error) {
      console.warn(`[keep-alive] ping failed: ${error.message}`);
    }
  }, INTERVAL_MS);
}
