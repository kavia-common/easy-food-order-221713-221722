import { v4 as uuidv4 } from 'uuid'

type InitSessionInput = {
  orderDraft: {
    amount: number
    orderId?: string
  }
}
type InitSessionResult = {
  sessionId: string
  payableAmount: number
  orderId: string
}

export type UPISupportedProvider = 'googlepay' | 'phonepe' | 'paytm' | 'bhim'

export type StartUPIInput = {
  provider?: UPISupportedProvider
  amount: number
  orderId: string
  vpa?: string
  merchantName?: string
}
export type StartCardInput = {
  amount: number
  orderId: string
  cardToken?: string
}

export type PaymentSuccess = {
  ok: true
  orderId: string
  txnRef: string
  method: 'upi' | 'card' | 'cod'
}
export type PaymentFailure = {
  ok: false
  orderId?: string
  reason: string
}
export type PaymentResult = PaymentSuccess | PaymentFailure

type EnvConfig = {
  enableUPI: boolean
  enableCard: boolean
  enableCOD: boolean
  defaultVpa: string
  merchantName: string
}

function readEnv(): EnvConfig {
  const env: any = (import.meta as any).env || {}
  const isDev = String(env.VITE_NODE_ENV || env.NODE_ENV || 'development') !== 'production'
  const enableUPI = env.VITE_ENABLE_UPI !== 'false'
  const enableCard = env.VITE_ENABLE_CARD !== 'false'
  const enableCOD = env.VITE_ENABLE_COD !== 'false'
  return {
    enableUPI: isDev ? true : enableUPI,
    enableCard: isDev ? true : enableCard,
    enableCOD: isDev ? true : enableCOD,
    defaultVpa: env.VITE_UPI_VPA || 'demo@upi',
    merchantName: env.VITE_UPI_MERCHANT_NAME || 'Demo Merchant',
  }
}

// PUBLIC_INTERFACE
export function getAvailableMethods() {
  /** Returns flags for available payment methods derived from env. */
  const cfg = readEnv()
  return {
    upi: cfg.enableUPI,
    card: cfg.enableCard,
    cod: cfg.enableCOD,
  }
}

// PUBLIC_INTERFACE
export async function initPayment(input: InitSessionInput): Promise<InitSessionResult> {
  /**
   * Initializes a mock payment session for the given order draft.
   * In production integrate with PSP via VITE_API_BASE.
   */
  const orderId = input.orderDraft.orderId || uuidv4()
  return {
    sessionId: uuidv4(),
    payableAmount: Math.max(0, Math.round(input.orderDraft.amount)),
    orderId,
  }
}

function buildUPILink({ amount, orderId, vpa, merchantName }: { amount: number; orderId: string; vpa?: string; merchantName?: string }) {
  const cfg = readEnv()
  const pa = encodeURIComponent(vpa || cfg.defaultVpa)
  const pn = encodeURIComponent(merchantName || cfg.merchantName)
  const am = encodeURIComponent((amount / 100).toFixed(2))
  const tn = encodeURIComponent(`Order ${orderId}`)
  const tr = encodeURIComponent(uuidv4())
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&tr=${tr}&cu=INR`
}

// PUBLIC_INTERFACE
export async function startUPIPayment(input: StartUPIInput): Promise<PaymentResult & { deeplink: string }> {
  /**
   * Starts a mock UPI payment using deeplink. Provide link for intent/QR fallback.
   * TODO: Replace with server-created UPI collect request and status polling.
   */
  const link = buildUPILink({
    amount: input.amount,
    orderId: input.orderId,
    vpa: input.vpa,
    merchantName: input.merchantName,
  })
  // Mock: we don't know result yet; caller can poll or allow manual confirm.
  // Resolve "pending" like result as ok=false with special reason, but include deeplink.
  return {
    ok: false,
    orderId: input.orderId,
    reason: 'PENDING_CONFIRMATION',
    deeplink: link,
  } as any
}

// PUBLIC_INTERFACE
export async function startCardPayment(input: StartCardInput): Promise<PaymentResult> {
  /**
   * Starts a mock card payment; expects tokenization to be done client-side.
   * TODO: POST to PSP or backend at VITE_API_BASE.
   */
  if (!input.cardToken) {
    return { ok: false, orderId: input.orderId, reason: 'MISSING_CARD_TOKEN' }
  }
  // Simulate occasional failure
  const fail = Math.random() < 0.05
  if (fail) {
    return { ok: false, orderId: input.orderId, reason: 'CARD_DECLINED' }
  }
  return { ok: true, orderId: input.orderId, txnRef: uuidv4(), method: 'card' }
}

// PUBLIC_INTERFACE
export async function selectCOD(orderId: string): Promise<PaymentResult> {
  /**
   * Selects Cash on Delivery; always succeeds in mock.
   */
  return { ok: true, orderId, txnRef: `COD-${Date.now()}`, method: 'cod' }
}

// PUBLIC_INTERFACE
export function tokenizeCard(card: { cardNumber: string; expMonth: string; expYear: string; cvv: string; cardholder: string }): Promise<string> {
  /**
   * Mock client-side tokenization. Do NOT store card details. Dev-only disclaimer.
   * TODO: Replace with Stripe/Razorpay SDK tokenize method.
   */
  return new Promise((resolve, reject) => {
    const digits = String(card.cardNumber || '').replace(/\s+/g, '')
    const cvvOk = /^[0-9]{3,4}$/.test(card.cvv || '')
    const expM = Number(card.expMonth)
    const expY = Number(card.expYear)
    if (!/^[0-9]{13,19}$/.test(digits) || !cvvOk || !(expM >= 1 && expM <= 12) || !(expY >= 24 && expY <= 40)) {
      reject(new Error('Invalid card details'))
      return
    }
    setTimeout(() => resolve(`tok_${uuidv4()}`), 300)
  })
}

// PUBLIC_INTERFACE
export function buildUPIQRCodeData(link: string): string {
  /** Returns content string for QR encoders. Here, we return the link itself. */
  return link
}

// PUBLIC_INTERFACE
export function getUPIDefaults() {
  /** Exposes default VPA and merchant name for UI. */
  const cfg = readEnv()
  return { vpa: cfg.defaultVpa, merchantName: cfg.merchantName }
}
