import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { CartLine, FoodItem, CartTotals } from '@/types'
import type { Coupon } from '@/services/coupons'
import { computeTotals, lineSubtotal, safeRound2 } from '@/services/pricing'
import { validateCoupon as asyncValidateCoupon, couponMeetsSubtotal } from '@/services/coupons'

type State = {
  lines: CartLine[]
  taxRate: number
  couponCode?: string | null
}

const STORAGE_KEY = 'cart_state_v3'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function loadPersisted(): State | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as State) : null
  } catch {
    return null
  }
}

function getDefaultTaxRate(): number {
  // Read env if available; fallback to 0.0 gracefully
  const envRate = (import.meta as any)?.env?.TAX_RATE ?? (import.meta as any)?.env?.VITE_TAX_RATE
  const parsed = Number(envRate)
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed
  return 0.0
}

export const useCartStore = defineStore('cart', () => {
  const initial = loadPersisted()
  const lines = ref<CartLine[]>(initial?.lines ?? [])
  const taxRate = ref<number>(initial?.taxRate ?? getDefaultTaxRate())
  const appliedCoupon = ref<Coupon | null>(null)
  const appliedCouponCode = ref<string | null>(initial?.couponCode ?? null)
  const couponError = ref<string | null>(null)

  // hydrate coupon if code was persisted (lazy validate without breaking UI)
  if (appliedCouponCode.value) {
    asyncValidateCoupon(appliedCouponCode.value).then(res => {
      if (res.valid) appliedCoupon.value = res.coupon
      else {
        appliedCoupon.value = null
        appliedCouponCode.value = null
      }
    }).catch(() => {
      // ignore network errors; keep code, treat as no coupon until successful
    })
  }

  const count = computed(() => lines.value.reduce((sum, l) => sum + l.qty, 0))
  const subtotal = computed(() => lineSubtotal(lines.value))

  const totals = computed<CartTotals>(() => {
    const result = computeTotals({
      lines: lines.value,
      taxRate: taxRate.value,
      coupon: appliedCoupon.value && couponMeetsSubtotal(subtotal.value, appliedCoupon.value) ? appliedCoupon.value : null,
      deliveryFee: 0, // optional fee; set via checkout flow or settings if needed
    })
    return {
      subtotal: result.subtotal,
      discount: result.discount,
      tax: result.tax,
      total: safeRound2(result.total),
    }
  })

  function persist() {
    try {
      if (!canUseStorage()) return
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lines: lines.value, taxRate: taxRate.value, couponCode: appliedCouponCode.value }),
      )
    } catch {
      // ignore
    }
  }

  // PUBLIC_INTERFACE
  function addItem(item: FoodItem, qty = 1) {
    /** Add an item to cart or increase its quantity. */
    const existing = lines.value.find((l) => l.id === item.id)
    if (existing) {
      existing.qty = Math.min(99, existing.qty + qty)
    } else {
      lines.value.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image: (item as any).image,
        qty: Math.max(1, qty),
      })
    }
  }

  // debounce helper to avoid excessive recomputations on rapid updates
  let qtyDebounce: any = null
  function schedulePersistDebounced() {
    if (qtyDebounce) clearTimeout(qtyDebounce)
    qtyDebounce = setTimeout(() => {
      qtyDebounce = null
      persist()
    }, 120)
  }

  // PUBLIC_INTERFACE
  function updateQty(id: string, qty: number) {
    /** Set a new quantity for a line item. Removes when qty <= 0. */
    const idx = lines.value.findIndex((l) => l.id === id)
    if (idx >= 0) {
      if (qty <= 0) lines.value.splice(idx, 1)
      else lines.value[idx].qty = Math.min(99, Math.max(1, qty))
      schedulePersistDebounced()
    }
  }

  // PUBLIC_INTERFACE
  function removeItem(id: string) {
    /** Removes a line from cart. */
    const idx = lines.value.findIndex((l) => l.id === id)
    if (idx >= 0) {
      lines.value.splice(idx, 1)
      schedulePersistDebounced()
    }
  }

  // PUBLIC_INTERFACE
  function clear() {
    /** Clears all cart lines and applied coupon. */
    lines.value = []
    appliedCoupon.value = null
    appliedCouponCode.value = null
    couponError.value = null
    persist()
  }

  // PUBLIC_INTERFACE
  async function applyCoupon(code: string): Promise<boolean> {
    /** Validate and apply a coupon code using service; persists when valid. */
    couponError.value = null
    const res = await asyncValidateCoupon(code)
    if (!res.valid) {
      couponError.value = res.reason || 'Invalid coupon code.'
      appliedCoupon.value = null
      appliedCouponCode.value = null
      return false
    }
    // Check subtotal constraint client-side
    const sub = subtotal.value
    if (!couponMeetsSubtotal(sub, res.coupon)) {
      couponError.value = `Coupon requires a minimum subtotal of $${(res.coupon.minSubtotal ?? 0).toFixed(2)}.`
      appliedCoupon.value = null
      appliedCouponCode.value = null
      return false
    }
    appliedCoupon.value = res.coupon
    appliedCouponCode.value = res.coupon.code
    couponError.value = null
    persist()
    return true
  }

  // PUBLIC_INTERFACE
  function removeCoupon() {
    /** Remove any applied coupon. */
    appliedCoupon.value = null
    appliedCouponCode.value = null
    couponError.value = null
    persist()
  }

  const discount = computed(() => totals.value.discount)
  const tax = computed(() => totals.value.tax)
  const total = computed(() => totals.value.total)

  watch([lines, taxRate, appliedCouponCode], persist, { deep: true })

  return {
    lines,
    count,
    subtotal,
    discount,
    tax,
    total,
    totals,
    taxRate,
    couponError,
    appliedCouponCode,
    addItem,
    updateQty,
    removeItem,
    clear,
    applyCoupon,
    removeCoupon,
  }
})
