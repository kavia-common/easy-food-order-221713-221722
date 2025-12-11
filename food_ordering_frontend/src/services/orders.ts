import { v4 as uuidv4 } from 'uuid'
import type { CartTotals } from '@/types'
import { useCartStore } from '@/stores/cart'

export type OrderDraft = {
  address?: {
    fullName: string
    phone?: string
    line1: string
    line2?: string
    city: string
    state?: string
    postalCode?: string
    country?: string
    instructions?: string
  }
  contact?: { email?: string }
  notes?: string
}

export type CreatedOrder = {
  id: string
  status: 'pending' | 'confirmed'
  totals: CartTotals
  lines: { id: string; name: string; qty: number; price: number }[]
  createdAt: string
}

const LAST_ORDER_KEY = 'last_order_receipt_v1'

// PUBLIC_INTERFACE
export async function createOrder(draft: OrderDraft): Promise<CreatedOrder> {
  /** Creates a mock order from current cart; persists to localStorage for confirmation view. */
  const cart = useCartStore()
  const id = uuidv4()
  const created: CreatedOrder = {
    id,
    status: 'pending',
    totals: cart.totals,
    lines: cart.lines.map(l => ({ id: l.id, name: l.name, qty: l.qty, price: l.price })),
    createdAt: new Date().toISOString(),
  }
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(created))
    }
  } catch { /* ignore */ }
  return created
}

// PUBLIC_INTERFACE
export function storeLastOrder(order: CreatedOrder) {
  /** Stores last order receipt to localStorage. */
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
    }
  } catch { /* ignore */ }
}

// PUBLIC_INTERFACE
export function getLastOrder(): CreatedOrder | null {
  /** Retrieves last order receipt from localStorage, if available. */
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(LAST_ORDER_KEY)
    return raw ? (JSON.parse(raw) as CreatedOrder) : null
  } catch {
    return null
  }
}
