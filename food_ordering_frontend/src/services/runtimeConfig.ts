export function getApiBase(): string {
  /**
   * PUBLIC_INTERFACE
   * Returns the backend API base URL from environment variables.
   * Reads VITE_API_BASE or falls back to VITE_BACKEND_URL to avoid hardcoding.
   * Note: Ensure these environment variables are set in the environment (via .env).
   */
  const base = import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || ''
  return String(base || '').trim()
}

/**
 * PUBLIC_INTERFACE
 * Returns the WebSocket base URL from environment variables.
 * It reads VITE_WS_URL or derives from VITE_API_BASE/VITE_BACKEND_URL by swapping http(s) -> ws(s)
 */
export function getWsUrl(): string | undefined {
  const ws = (import.meta as any).env?.VITE_WS_URL as string | undefined
  if (ws && String(ws).trim()) return String(ws).trim()
  const api = getApiBase()
  if (!api) return undefined
  try {
    // if API is relative path like "/api", default WS to "/ws"
    if (api.startsWith('/')) return '/ws'
    const url = new URL(api, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    // default ws path "/ws"
    const wsUrl = url.toString().replace(/^http/, 'ws')
    // ensure no trailing slash duplication
    return wsUrl.replace(/\/+$/, '') + '/ws'
  } catch {
    return undefined
  }
}

/**
 * PUBLIC_INTERFACE
 * Indicates whether websockets should be used based on VITE_WS_URL or VITE_WS_URL presence and VITE_NODE_ENV not being 'test'
 */
export function shouldUseWebsocket(): boolean {
  const env = (import.meta as any).env || {}
  const disabledByEnv = String(env.VITE_NODE_ENV || '').toLowerCase() === 'test'
  const hasWs = !!(env.VITE_WS_URL || getWsUrl())
  return hasWs && !disabledByEnv
}
