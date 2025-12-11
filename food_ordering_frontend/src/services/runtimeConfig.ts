import { featureFlags, getApiBase as apiBaseFromApiService } from './api'

/**
 * Safe URL validation helper.
 */
function isValidUrl(u: unknown): u is string {
  if (typeof u !== 'string' || u.trim().length === 0) return false
  try {
    // Allow relative-like by providing base so URL() won't throw
    // This is only for validation; consumers should use absolute URLs when fetching.
    new URL(u, 'http://localhost')
    return true
  } catch {
    return false
  }
}

// PUBLIC_INTERFACE
export function getApiBase(): string | undefined {
  /**
   * Returns a valid API base or undefined. Delegates to api.ts helper which
   * already includes robust validation and mock fallback logic.
   */
  return apiBaseFromApiService()
}

// PUBLIC_INTERFACE
export function getFrontendUrl(): string | undefined {
  /** Returns frontend URL if valid; undefined otherwise. */
  const v = import.meta.env.VITE_FRONTEND_URL
  return isValidUrl(v) ? String(v) : undefined
}

// PUBLIC_INTERFACE
export function getWsUrl(): string | undefined {
  /** Returns WS URL if valid; undefined otherwise. */
  const v = import.meta.env.VITE_WS_URL
  return isValidUrl(v) ? String(v) : undefined
}

// PUBLIC_INTERFACE
export function networkEnabled(defaultValue = false): boolean {
  /**
   * Returns whether network features should be enabled.
   * If API base exists and is valid, network is enabled unless explicitly disabled by flag.
   */
  const base = getApiBase()
  const forced =
    typeof featureFlags.enableNetwork === 'boolean' ? featureFlags.enableNetwork : undefined
  if (typeof forced === 'boolean') return forced
  return !!base || defaultValue
}

// PUBLIC_INTERFACE
export function shouldUseWebsocket(): boolean {
  /**
   * Only allow websocket usage if WS URL is present and network is allowed.
   */
  return !!getWsUrl() && networkEnabled(false)
}
