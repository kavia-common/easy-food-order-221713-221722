import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { CartLine, FoodItem } from '@/types'

type State = {
  lines: CartLine[]
  taxRate: number
}

const STORAGE_KEY = 'cart_state_v1'

function loadPersisted(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as State : null
  } catch {
    return null
  }
}

export const useCartStore = defineStore('cart', () => {
  const initial = loadPersisted()
  const lines = ref<CartLine[]>(initial?.lines ?? [])
  const taxRate = ref<number>(initial?.taxRate ?? 0.08)

  const count = computed(() => lines.value.reduce((sum, l) => sum + l.qty, 0))
  const subtotal = computed(() => lines.value.reduce((sum, l) => sum + l.price * l.qty, 0))
  const tax = computed(() => +(subtotal.value * taxRate.value).toFixed(2))
  const total = computed(() => +(subtotal.value + tax.value).toFixed(2))

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: lines.value, taxRate: taxRate.value }))
    } catch {}
  }

  // PUBLIC_INTERFACE
  function addItem(item: FoodItem, qty = 1) {
    /** Add an item to cart or increase its quantity. */
    const existing = lines.value.find((l) => l.id === item.id)
    if (existing) {
      existing.qty += qty
    } else {
      lines.value.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        qty,
      })
    }
  }

  // PUBLIC_INTERFACE
  function updateQty(id: string, qty: number) {
    /** Set a new quantity for a line item. Removes when qty <= 0. */
    const idx = lines.value.findIndex((l) => l.id === id)
    if (idx >= 0) {
      if (qty <= 0) lines.value.splice(idx, 1)
      else lines.value[idx].qty = qty
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
    /** Clears all cart lines. */
    lines.value = []
  }

  watch([lines, taxRate], persist, { deep: true })

  return { lines, count, subtotal, tax, total, taxRate, addItem, updateQty, removeItem, clear }
})
