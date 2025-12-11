import type { Invoice, OrderDetail, OrderSummary, OrderTotals, OrderLine, AddressSnapshot, PaymentSnapshot } from '@/types/orders';
import { isCouponValid } from './couponsHelper';
import { getApiBase } from './runtimeConfig';

const STORAGE_KEY = 'app.orderHistory.v1';

function safeWindow(): Window | undefined {
  if (typeof window === 'undefined') return undefined;
  return window;
}

function readLocal<T>(key: string): T | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    const raw = w.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, value: T): void {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function currency(amount: number, currency = 'USD') {
  return { amount, currency };
}

function calcTotals(lines: OrderLine[], couponCodes?: string[]): OrderTotals {
  const subtotalAmt = lines.reduce((sum, l) => sum + l.unitPrice.amount * l.quantity, 0);
  let discountAmt = 0;
  if (couponCodes && couponCodes.length) {
    const valid = couponCodes.find((c) => isCouponValid(c));
    if (valid) {
      discountAmt = +(subtotalAmt * 0.1).toFixed(2);
    }
  }
  const taxable = subtotalAmt - discountAmt;
  const taxAmt = +(taxable * 0.08).toFixed(2);
  const deliveryFeeAmt = +(5).toFixed(2);
  const totalAmt = +(taxable + taxAmt + deliveryFeeAmt).toFixed(2);

  return {
    subtotal: currency(+subtotalAmt.toFixed(2)),
    discount: discountAmt ? currency(discountAmt) : undefined,
    tax: currency(taxAmt),
    deliveryFee: currency(deliveryFeeAmt),
    tip: undefined,
    total: currency(totalAmt),
  };
}

function seedMockHistoryIfEmpty() {
  const existing = readLocal<{ summaries: OrderSummary[]; details: Record<string, OrderDetail> }>(STORAGE_KEY);
  if (existing && existing.summaries?.length) return;

  const now = new Date();
  const earlier = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3);
  const lines1: OrderLine[] = [
    {
      id: 'l1',
      itemId: 'burger-001',
      restaurantId: 'rest-001',
      name: 'Classic Cheeseburger',
      options: ['No onions', 'Extra cheese'],
      unitPrice: currency(8.99),
      quantity: 2,
      imageUrl: '/assets/burger.png',
    },
    {
      id: 'l2',
      itemId: 'fries-101',
      restaurantId: 'rest-001',
      name: 'Crispy Fries',
      unitPrice: currency(3.49),
      quantity: 1,
      imageUrl: '/assets/fries.png',
    },
  ];
  const addr1: AddressSnapshot = {
    fullName: 'Alex Johnson',
    line1: '100 Market St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US',
    phone: '555-123-4567',
  };
  const pay1: PaymentSnapshot = {
    method: 'card',
    brand: 'VISA',
    last4: '4242',
    txnRef: 'txn_mock_123',
    paid: true,
  };
  const totals1 = calcTotals(lines1, ['WELCOME10']);

  const order1: OrderDetail = {
    id: 'ord-1001',
    placedAt: earlier.toISOString(),
    status: 'delivered',
    restaurantName: 'Blue Ocean Diner',
    restaurantId: 'rest-001',
    lineCount: lines1.reduce((s, l) => s + l.quantity, 0),
    total: totals1.total,
    lines: lines1,
    fulfillment: {
      type: 'delivery',
      deliveredAt: new Date(earlier.getTime() + 1000 * 60 * 45).toISOString(),
      etaMinutes: 45,
    },
    addressSnapshot: addr1,
    paymentSnapshot: pay1,
    couponCodes: ['WELCOME10'],
    notes: 'Leave at door.',
  };

  const lines2: OrderLine[] = [
    {
      id: 'l1',
      itemId: 'pizza-001',
      restaurantId: 'rest-002',
      name: 'Margherita Pizza',
      unitPrice: currency(12.5),
      quantity: 1,
      imageUrl: '/assets/pizza.png',
    },
  ];
  const totals2 = calcTotals(lines2);
  const order2: OrderDetail = {
    id: 'ord-1002',
    placedAt: new Date(now.getTime() - 1000 * 60 * 60 * 20).toISOString(),
    status: 'confirmed',
    restaurantName: 'Amber Slice Pizzeria',
    restaurantId: 'rest-002',
    lineCount: 1,
    total: totals2.total,
    lines: lines2,
    fulfillment: { type: 'pickup', etaMinutes: 20 },
    paymentSnapshot: { method: 'card', brand: 'Mastercard', last4: '4444', paid: true },
  };

  const summaries: OrderSummary[] = [order2, order1].map((o) => ({
    id: o.id,
    placedAt: o.placedAt,
    status: o.status,
    restaurantName: o.restaurantName,
    restaurantId: o.restaurantId,
    lineCount: o.lineCount,
    total: o.total,
  }));

  const details: Record<string, OrderDetail> = {
    [order1.id]: order1,
    [order2.id]: order2,
  };

  writeLocal(STORAGE_KEY, { summaries, details });
}

function ensureSeeded() {
  const w = safeWindow();
  if (!w) return;
  seedMockHistoryIfEmpty();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...(init || {}) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// PUBLIC_INTERFACE
export async function fetchOrderHistory(): Promise<OrderSummary[]> {
  /** Fetch order history summaries from backend if available, else from localStorage mock. */
  ensureSeeded();
  const base = getApiBase();
  if (base) {
    try {
      const data = await fetchJson<OrderSummary[]>(`${String(base).replace(/\/*$/, '')}/orders`);
      return data;
    } catch {
      // fall through to local
    }
  }
  const local = readLocal<{ summaries: OrderSummary[]; details: Record<string, OrderDetail> }>(STORAGE_KEY);
  return local?.summaries ?? [];
}

// PUBLIC_INTERFACE
export async function fetchOrderById(orderId: string): Promise<OrderDetail | null> {
  /** Fetch order detail by id from backend if available, else from localStorage mock. */
  ensureSeeded();
  const base = getApiBase();
  if (base) {
    try {
      const data = await fetchJson<OrderDetail>(`${String(base).replace(/\/*$/, '')}/orders/${orderId}`);
      return data;
    } catch {
      // fall back
    }
  }
  const local = readLocal<{ summaries: OrderSummary[]; details: Record<string, OrderDetail> }>(STORAGE_KEY);
  return local?.details?.[orderId] ?? null;
}

// PUBLIC_INTERFACE
export async function fetchInvoice(orderId: string): Promise<Invoice | null> {
  /** Return a printable invoice representation. Falls back to creating one from order detail. */
  const base = getApiBase();
  if (base) {
    try {
      const data = await fetchJson<Invoice>(`${String(base).replace(/\/*$/, '')}/orders/${orderId}/invoice`);
      return data;
    } catch {
      // fall back
    }
  }
  const detail = await fetchOrderById(orderId);
  if (!detail) return null;
  const billedTo: AddressSnapshot =
    detail.addressSnapshot ??
    ({
      fullName: 'Pickup Customer',
      line1: detail.restaurantName,
      city: '',
      country: 'US',
    } as AddressSnapshot);
  const lines: { description: string; quantity: number; unitPrice: { currency: string; amount: number }; lineTotal: { currency: string; amount: number } }[] =
    detail.lines.map((l) => ({
      description: `${l.name}${l.options && l.options.length ? ` (${l.options.join(', ')})` : ''}`,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: { currency: l.unitPrice.currency, amount: +(l.unitPrice.amount * l.quantity).toFixed(2) },
    }));
  const totals = calcTotals(detail.lines, detail.couponCodes);
  return {
    orderId: detail.id,
    invoiceNumber: `INV-${detail.id}`,
    issuedAt: new Date().toISOString(),
    billedTo,
    lines,
    totals,
    payment: detail.paymentSnapshot ?? { method: 'cash', paid: false },
    restaurantName: detail.restaurantName,
  };
}

// PUBLIC_INTERFACE
export function appendOrderToHistory(newOrder: OrderDetail): void {
  /** Append a newly placed order to mock storage so it appears immediately in history. */
  ensureSeeded();
  const local = readLocal<{ summaries: OrderSummary[]; details: Record<string, OrderDetail> }>(STORAGE_KEY) || {
    summaries: [],
    details: {},
  };
  local.details[newOrder.id] = newOrder;
  const summary: OrderSummary = {
    id: newOrder.id,
    placedAt: newOrder.placedAt,
    status: newOrder.status,
    restaurantName: newOrder.restaurantName,
    restaurantId: newOrder.restaurantId,
    lineCount: newOrder.lineCount,
    total: newOrder.total,
  };
  local.summaries = [summary, ...local.summaries.filter((s) => s.id !== summary.id)];
  writeLocal(STORAGE_KEY, local);
}

// PUBLIC_INTERFACE
export function updateOrderStatus(orderId: string, status: OrderDetail['status']) {
  /** Helper to update local status (for demo) */
  const local = readLocal<{ summaries: OrderSummary[]; details: Record<string, OrderDetail> }>(STORAGE_KEY);
  if (!local) return;
  if (local.details[orderId]) local.details[orderId].status = status;
  local.summaries = local.summaries.map((s) => (s.id === orderId ? { ...s, status } : s));
  writeLocal(STORAGE_KEY, local);
}
