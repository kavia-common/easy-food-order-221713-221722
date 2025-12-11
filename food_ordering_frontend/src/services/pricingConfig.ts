import { isServer } from './helpersRuntime'

export type DeliveryPricingOptions = {
  /** Base delivery fee in currency units (e.g., 2.99 USD). */
  baseFee: number
  /**
   * Rush hour surcharge in currency units.
   * Applied when current local time falls into configured rush windows.
   */
  rushSurcharge: number
  /**
   * Weekend surcharge in currency units (Sat/Sun).
   */
  weekendSurcharge: number
  /**
   * Comma-separated rush hour ranges in local time, e.g., "11:30-14:00,18:00-21:00"
   */
  rushHours: string
}

/**
 * PUBLIC_INTERFACE
 * Returns delivery pricing options from environment variables with fallbacks.
 */
export function getDeliveryPricingOptions(): DeliveryPricingOptions {
  /** Read from import.meta.env; never throw when absent. */
  const env = (import.meta as any)?.env || {}
  const readNum = (v: any, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  // Default values
  const defaults: DeliveryPricingOptions = {
    baseFee: 2.99,
    rushSurcharge: 1.0,
    weekendSurcharge: 0.75,
    rushHours: '11:30-14:00,18:00-21:00',
  }

  const baseFee = readNum(env.VITE_DELIVERY_BASE_FEE, defaults.baseFee)
  const rushSurcharge = readNum(env.VITE_DELIVERY_RUSH_SURCHARGE, defaults.rushSurcharge)
  const weekendSurcharge = readNum(env.VITE_DELIVERY_WEEKEND_SURCHARGE, defaults.weekendSurcharge)
  const rushHours = String(env.VITE_RUSH_HOURS || defaults.rushHours)

  // Clamp to non-negative sane values
  return {
    baseFee: Math.max(0, baseFee),
    rushSurcharge: Math.max(0, rushSurcharge),
    weekendSurcharge: Math.max(0, weekendSurcharge),
    rushHours,
  }
}

/**
 * PUBLIC_INTERFACE
 * Returns the current IANA timezone string best-effort.
 */
export function getLocalTimezone(): string | undefined {
  if (isServer()) return undefined
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}
