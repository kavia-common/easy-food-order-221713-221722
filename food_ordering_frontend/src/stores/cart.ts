import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { CartLine, FoodItem, CartTotals } from '@/types'
import type { Coupon } from '@/utils/coupons'
import { calcDiscount, clampCurrency, findCouponByCode, validateCoupon } from '@/utils/coupons'

type State = {
  lines: CartLine[]
  taxRate: number
  couponCode?: string | null
}

const STORAGE_KEY = 'cart_state_v2'

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

export const useCartStore = defineStore('cart', () => {
  const initial = loadPersisted()
  const lines = ref<CartLine[]>(initial?.lines ?? [])
  const taxRate = ref<number>(initial?.taxRate ?? 0.08)
  const appliedCouponCode = ref<string | null>(initial?.couponCode ?? null)
  const couponError = ref<string | null>(null)

  const count = computed(() => lines.value.reduce((sum, l) => sum + l.qty, 0))
  const subtotal = computed(() => clampCurrency(lines.value.reduce((sum, l) => sum + l.price * l.qty, 0)))
  const currentCoupon = computed<Coupon | null>(() => {
    if (!appliedCouponCode.value) return null
    return findCouponByCode(appliedCouponCode.value)
  })

  const discount = computed(() => {
    const c = currentCoupon.value
    // Validate each time based on current subtotal
    if (!c) return 0
    const err = validateCoupon(c, subtotal.value)
    if (err) return 0
    return clampCurrency(calcDiscount(c, subtotal.value))
  })

  const taxableAmount = computed(() => Math.max(0, subtotal.value - discount.value))
  const tax = computed(() => clampCurrency(taxableAmount.value * taxRate.value))
  const total = computed(() => clampCurrency(taxableAmount.value + tax.value))

  const totals = computed<CartTotals>(() => ({
    subtotal: subtotal.value,
    discount: discount.value,
    tax: tax.value,
    total: total.value,
  }))

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
        image: item.image,
        qty: Math.max(1, qty),
      })
    }
  }

  // PUBLIC_INTERFACE
  function updateQty(id: string, qty: number) {
    /** Set a new quantity for a line item. Removes when qty <= 0. */
    const idx = lines.value.findIndex((l) => l.id === id)
    if (idx >= 0) {
      if (qty <= 0) lines.value.splice(idx, 1)
      else lines.value[idx].qty = Math.min(99, Math.max(1, qty))
    }
  }

  // PUBLIC_INTERFACE
  function removeItem(id: string) {
    /** Removes a line from cart. */
    const idx = lines.value.findIndex((l) => l.id === id)
    if (idx >= 0) lines.value.splice(idx, 1)
  }

  // PUBLIC_INTERFACE
  function clear() {
    /** Clears all cart lines and applied coupon. */
    lines.value = []
    appliedCouponCode.value = null
    couponError.value = null
  }

  // PUBLIC_INTERFACE
  function applyCoupon(code: string): boolean {
    /** Apply a coupon code after validating rules against current subtotal. */
    const c = findCouponByCode(code)
    if (!c) {
      couponError.value = 'Invalid coupon code.'
      return false
    }
    const err = validateCoupon(c, subtotal.value)
    if (err) {
      couponError.value = err
      return false
    }
    appliedCouponCode.value = c.code
    couponError.value = null
    return true
  }

  // PUBLIC_INTERFACE
  function removeCoupon() {
    /** Remove any applied coupon. */
    appliedCouponCode.value = null
    couponError.value = null
  }

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
