/// notifications.ts
/// Lightweight notifications service to handle browser capability checks, permission flow,
/// user preference storage, and mock in-app notifications for "Festival Offers".

/**
 * Environment-aware flags and URLs.
 * We respect VITE_FEATURE_FLAGS if present; otherwise default to enabled in dev mode.
 */
const rawFlags = import.meta.env.VITE_FEATURE_FLAGS as string | undefined;
const nodeEnv = import.meta.env.VITE_NODE_ENV as string | undefined;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL as string | undefined;
const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (import.meta.env.VITE_BACKEND_URL as string | undefined);

/**
 * Feature flags parser. Expects comma-separated values or JSON-ish object.
 * Examples:
 * - "notifications,experiments"
 * - '{"notifications":true,"beta":false}'
 */
function parseFeatureFlags(input?: string): Record<string, boolean> {
  if (!input) return {};
  try {
    // Try JSON-style
    const asObj = JSON.parse(input);
    if (typeof asObj === 'object' && asObj) return asObj as Record<string, boolean>;
  } catch {
    // Ignore
  }
  // Fallback comma-separated
  const out: Record<string, boolean> = {};
  input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((k) => (out[k] = true));
  return out;
}

const FLAGS = parseFeatureFlags(rawFlags);
const DEV_MODE = !!(nodeEnv ? nodeEnv.includes('dev') : import.meta.env.DEV);
const NOTIFICATIONS_FEATURE_ENABLED = FLAGS.notifications ?? DEV_MODE;

// Preference keys
const LS_KEYS = {
  festivalOffersOptIn: 'notifications.festivalOffers.optIn',
  lastPermission: 'notifications.permission.cached',
  lastSubscription: 'notifications.subscription.cached', // placeholder cache for push subscription
};

// Basic type describing current notification capability state
export type NotificationCapabilityState = 'not_supported' | 'blocked' | 'prompt' | 'granted';

// Cache some computed state to avoid duplicate work
let cachedPermission: NotificationPermission | null = null;
let cachedCapability: NotificationCapabilityState | null = null;
let subscriptionCached = false;

// PUBLIC_INTERFACE
export function isNotificationsFeatureEnabled(): boolean {
  /** Returns whether the Notifications feature is enabled by flags or dev defaults. */
  return NOTIFICATIONS_FEATURE_ENABLED;
}

// PUBLIC_INTERFACE
export function isPushSupported(): boolean {
  /** Returns true if the browser seems to support notifications and service workers for push. */
  const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasPush = typeof window !== 'undefined' && 'PushManager' in window;
  return hasNotification && hasSW && hasPush;
}

// PUBLIC_INTERFACE
export function getCapabilityState(): NotificationCapabilityState {
  /**
   * Map the environment and Notification.permission to a capability state:
   * - not_supported: No Notification or ServiceWorker/Push support.
   * - blocked: Permission is "denied".
   * - prompt: Permission is "default" (not yet granted/denied).
   * - granted: Permission is "granted".
   */
  if (!isNotificationsFeatureEnabled()) {
    // If disabled by flags, simulate as not supported to lock the UI
    return 'not_supported';
  }
  if (!isPushSupported()) {
    return 'not_supported';
  }
  const p = getNotificationPermission();
  if (p === 'denied') return 'blocked';
  if (p === 'granted') return 'granted';
  return 'prompt';
}

// PUBLIC_INTERFACE
export function getNotificationPermission(): NotificationPermission {
  /** Returns current Notification.permission with caching */
  if (cachedPermission) return cachedPermission;
  try {
    cachedPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  } catch {
    cachedPermission = 'denied';
  }
  // Store last known
  try {
    localStorage.setItem(LS_KEYS.lastPermission, cachedPermission);
  } catch {}
  return cachedPermission!;
}

// PUBLIC_INTERFACE
export function getFestivalOffersPreference(): boolean {
  /** Return saved user preference (opt-in) for Festival Offers notifications from localStorage */
  try {
    const v = localStorage.getItem(LS_KEYS.festivalOffersOptIn);
    return v === 'true';
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function setFestivalOffersPreference(value: boolean): void {
  /** Persist user preference in localStorage */
  try {
    localStorage.setItem(LS_KEYS.festivalOffersOptIn, value ? 'true' : 'false');
  } catch {
    // no-op
  }
}

// PUBLIC_INTERFACE
export async function ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  /**
   * Register the service worker if supported. Returns registration or null if not supported/fails.
   * Guarded to keep app working if unsupported.
   */
  if (!isPushSupported()) return null;
  try {
    // We use a fixed file name 'sw.js' at the site root by Vite build (public folder)
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('[notifications] Service worker registration failed:', err);
    return null;
  }
}

// PUBLIC_INTERFACE
export async function requestFestivalOffersPermission(): Promise<NotificationCapabilityState> {
  /**
   * Request browser permission interactively. Avoid duplicate prompts by checking current state.
   * It will attempt to register the service worker and set user preference to true on success.
   * Returns the resulting capability state.
   */
  if (!isNotificationsFeatureEnabled()) return 'not_supported';
  if (!isPushSupported()) return 'not_supported';

  const current = getNotificationPermission();
  if (current === 'granted') {
    cachedCapability = 'granted';
    return 'granted';
  }
  if (current === 'denied') {
    cachedCapability = 'blocked';
    return 'blocked';
  }

  try {
    const result = await Notification.requestPermission();
    cachedPermission = result;
    try {
      localStorage.setItem(LS_KEYS.lastPermission, result);
    } catch {}
    if (result === 'granted') {
      // Register SW and attempt to get subscription
      const reg = await ensureServiceWorkerRegistered();
      if (reg) {
        // In real apps we would call reg.pushManager.subscribe with VAPID key.
        // Placeholder: cache a mock subscription so we don't re-prompt pointlessly.
        subscriptionCached = true;
        try {
          localStorage.setItem(LS_KEYS.lastSubscription, 'mocked');
        } catch {}
        // TODO: Send subscription to backend when available.
        void sendSubscriptionToBackendPlaceholder();
      }
      cachedCapability = 'granted';
      return 'granted';
    }
    // result === 'denied' or 'default'
    cachedCapability = result === 'denied' ? 'blocked' : 'prompt';
    return cachedCapability;
  } catch (err) {
    console.warn('[notifications] Permission request failed:', err);
    return getCapabilityState();
  }
}

// PUBLIC_INTERFACE
export async function unsubscribeFestivalOffers(): Promise<void> {
  /**
   * Placeholder unsubscribe that clears cached subscription and preference.
   * In a real app, we'd get the PushSubscription and call unsubscribe(), then notify backend.
   */
  try {
    const reg = (await navigator.serviceWorker?.getRegistration?.()) ?? null;
    if (reg && 'pushManager' in reg) {
      try {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore unsupported or errors
  }
  try {
    localStorage.removeItem(LS_KEYS.lastSubscription);
  } catch {}
  subscriptionCached = false;
  // TODO: Notify backend of unsubscribe when available.
  void sendSubscriptionToBackendPlaceholder(true);
}

// PUBLIC_INTERFACE
export function getCapabilityHelpText(state: NotificationCapabilityState): string {
  /** Accessible, concise copy describing the current state. */
  switch (state) {
    case 'not_supported':
      return 'Push notifications are not supported in your browser.';
    case 'blocked':
      return 'Notifications are blocked. Update your browser settings to allow notifications.';
    case 'prompt':
      return 'You can enable notifications to get special festival offers.';
    case 'granted':
      return 'Notifications enabled for special festival offers.';
  }
}

// PUBLIC_INTERFACE
export function canToggleForState(state: NotificationCapabilityState): boolean {
  /** Whether the toggle control should be interactive given the capability state. */
  if (!isNotificationsFeatureEnabled()) return false;
  return state === 'prompt' || state === 'granted';
}

// PUBLIC_INTERFACE
export function isMockMode(): boolean {
  /**
   * Dev-only mock mode, enabled if feature is enabled and either:
   * - Not supported; or
   * - Permission denied; or
   * - Dev mode without backend/config ready.
   */
  if (!isNotificationsFeatureEnabled()) return false;
  const state = getCapabilityState();
  if (state === 'not_supported' || state === 'blocked') return true;
  // Also allow mock in dev when API/backends are not wired.
  return DEV_MODE;
}

// PUBLIC_INTERFACE
export function triggerMockFestivalOffer(cb?: (message: string) => void): void {
  /**
   * Lightweight in-app fallback to simulate a "special festival offer" notification.
   * Intended for dev/testing UX. This will call the provided callback with a message.
   */
  if (!isMockMode()) return;
  const message = 'Special Festival Offer: Get 20% off on your next order!';
  if (cb) cb(message);
}

// Placeholder: backend integration
async function sendSubscriptionToBackendPlaceholder(unsubscribe = false): Promise<void> {
  if (!API_BASE) {
    // No backend configured; log and skip.
    if (DEV_MODE) {
      console.info('[notifications] No API_BASE configured; skipping backend subscription call.');
    }
    return;
  }
  // TODO: Implement actual POST to API_BASE endpoint when backend is ready.
  // Keep it a no-op for now.
  if (DEV_MODE) {
    console.info(
      `[notifications] Placeholder ${unsubscribe ? 'UNSUBSCRIBE' : 'SUBSCRIBE'} call to backend at ${API_BASE} (not implemented)`,
    );
  }
}

/**
 * Export a small state snapshot helper for UI components.
 */
// PUBLIC_INTERFACE
export function getNotificationsUIState(): {
  enabled: boolean;
  state: NotificationCapabilityState;
  helpText: string;
  optIn: boolean;
} {
  const enabled = isNotificationsFeatureEnabled();
  const st = getCapabilityState();
  return {
    enabled,
    state: st,
    helpText: getCapabilityHelpText(st),
    optIn: getFestivalOffersPreference(),
  };
}
