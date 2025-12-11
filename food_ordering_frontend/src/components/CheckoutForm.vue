<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { createOrder } from '@/services/api'
import type { Address, CardDetails, OrderPayload, PaymentMethod, UpiWalletDetails, FulfillmentType } from '@/types'

const cart = useCartStore()
const loading = ref(false)
const successId = ref<string | null>(null)
const successEta = ref<number | undefined>(undefined)
const errorMsg = ref<string | null>(null)

type CheckoutState = {
  fulfillment: FulfillmentType
  // delivery
  address: Address
  // pickup
  pickup: { name: string; phone: string }
  paymentMethod: PaymentMethod
  card: CardDetails
  upi: UpiWalletDetails
  notes: string
}

const STORAGE_KEY = 'checkout_state_v1'
function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function saveState(v: CheckoutState) {
  try {
    if (!canUseStorage()) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  } catch { /* ignore */ }
}
function loadState(): CheckoutState | null {
  try {
    if (!canUseStorage()) return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CheckoutState) : null
  } catch {
    return null
  }
}

const state = reactive<CheckoutState>(
  loadState() ?? {
    fulfillment: 'delivery',
    address: {
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      notes: '',
    },
    pickup: { name: '', phone: '' },
    paymentMethod: 'cod',
    card: { cardholder: '', cardNumber: '', expMonth: '', expYear: '', cvv: '' },
    upi: { handle: '' },
    notes: '',
  },
)

watch(state, () => saveState(state), { deep: true })

const cardErrors = ref<string | null>(null)
const formErrors = ref<string | null>(null)

function validateBasics(): boolean {
  formErrors.value = null
  if (!cart.lines.length) {
    formErrors.value = 'Your cart is empty.'
    return false
  }
  if (state.fulfillment === 'delivery') {
    const a = state.address
    if (!a.name || !a.phone || !a.street || !a.city || !a.state || !a.zip) {
      formErrors.value = 'Please complete all delivery address fields.'
      return false
    }
  } else {
    if (!state.pickup.name || !state.pickup.phone) {
      formErrors.value = 'Please provide pickup name and phone.'
      return false
    }
  }

  if (state.paymentMethod === 'card') {
    cardErrors.value = null
    const c = state.card
    const digits = c.cardNumber.replace(/\s+/g, '')
    const cvvOk = /^[0-9]{3,4}$/.test(c.cvv)
    const expM = Number(c.expMonth)
    const expY = Number(c.expYear)
    if (!c.cardholder || !/^[0-9]{13,19}$/.test(digits) || !cvvOk || !(expM >= 1 && expM <= 12) || !(expY >= 24 && expY <= 40)) {
      cardErrors.value = 'Please enter valid card details (mock).'
      return false
    }
  }
  if (state.paymentMethod === 'upi') {
    if (!state.upi.handle || !/.+@.+/.test(state.upi.handle)) {
      formErrors.value = 'Please enter a valid UPI/Wallet handle (e.g., user@upi).'
      return false
    }
  }
  return true
}

async function onSubmit() {
  if (!validateBasics()) return
  errorMsg.value = null
  loading.value = true

  const payload: OrderPayload = {
    fulfillment: state.fulfillment,
    address: state.fulfillment === 'delivery' ? {
      name: state.address.name,
      phone: state.address.phone,
      street: state.address.street,
      city: state.address.city,
      state: state.address.state,
      zip: state.address.zip,
      notes: state.address.notes || undefined,
    } : undefined,
    pickup: state.fulfillment === 'pickup' ? {
      name: state.pickup.name,
      phone: state.pickup.phone,
    } : undefined,
    items: cart.lines.map(l => ({ id: l.id, qty: l.qty })),
    payment: {
      method: state.paymentMethod,
      card: state.paymentMethod === 'card' ? state.card : undefined,
      upi: state.paymentMethod === 'upi' ? state.upi : undefined,
    },
    notes: state.notes || undefined,
    totals: cart.totals,
  }

  const res = await createOrder(payload)
  loading.value = false
  if (res.status === 'success') {
    successId.value = res.id
    successEta.value = res.etaMin
    cart.clear()
    // Clear checkout state after success
    try {
      if (canUseStorage()) window.localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  } else {
    errorMsg.value = 'Order failed. Please try again.'
  }
}

onMounted(() => {
  // input focus improvement could go here
})
</script>

<template>
  <div class="card">
    <template v-if="!successId">
      <h2>Checkout</h2>
      <p class="help">Choose fulfillment, enter address or pickup details, and select a payment method.</p>

      <div v-if="errorMsg" class="alert error" role="alert">{{ errorMsg }}</div>
      <div v-if="formErrors" class="alert error" role="alert">{{ formErrors }}</div>
      <div v-if="cardErrors" class="alert error" role="alert">{{ cardErrors }}</div>

      <form @submit.prevent="onSubmit" class="form">
        <fieldset class="full" aria-labelledby="fulfillment-label">
          <legend id="fulfillment-label">Fulfillment</legend>
          <div class="seg">
            <button
              type="button"
              class="seg-btn"
              :class="{ active: state.fulfillment==='delivery' }"
              @click="state.fulfillment='delivery'"
              :aria-pressed="state.fulfillment==='delivery'"
            >
              Delivery
            </button>
            <button
              type="button"
              class="seg-btn"
              :class="{ active: state.fulfillment==='pickup' }"
              @click="state.fulfillment='pickup'"
              :aria-pressed="state.fulfillment==='pickup'"
            >
              Pickup
            </button>
          </div>
        </fieldset>

        <div v-if="state.fulfillment==='delivery'" class="grid" aria-label="Delivery address">
          <label>
            <span>Full name</span>
            <input v-model.trim="state.address.name" required aria-required="true" />
          </label>
          <label>
            <span>Phone</span>
            <input v-model.trim="state.address.phone" placeholder="e.g., 555-123-4567" required aria-required="true" />
          </label>
          <label class="full">
            <span>Street</span>
            <input v-model.trim="state.address.street" required aria-required="true" />
          </label>
          <label>
            <span>City</span>
            <input v-model.trim="state.address.city" required aria-required="true" />
          </label>
          <label>
            <span>State</span>
            <input v-model.trim="state.address.state" required aria-required="true" />
          </label>
          <label>
            <span>ZIP</span>
            <input v-model.trim="state.address.zip" required aria-required="true" />
          </label>
          <label class="full">
            <span>Delivery notes (optional)</span>
            <textarea v-model.trim="state.address.notes" rows="2" placeholder="Gate code, drop-off notes..." />
          </label>
        </div>

        <div v-else class="grid" aria-label="Pickup details">
          <label>
            <span>Pickup name</span>
            <input v-model.trim="state.pickup.name" required aria-required="true" />
          </label>
          <label>
            <span>Phone</span>
            <input v-model.trim="state.pickup.phone" required aria-required="true" />
          </label>
        </div>

        <fieldset class="full" aria-labelledby="payment-label">
          <legend id="payment-label">Payment</legend>
          <div class="row">
            <label class="radio">
              <input type="radio" value="cod" v-model="state.paymentMethod" aria-label="Cash on delivery" />
              <span>Cash on Delivery</span>
            </label>
            <label class="radio">
              <input type="radio" value="card" v-model="state.paymentMethod" aria-label="Pay by card" />
              <span>Card</span>
            </label>
            <label class="radio">
              <input type="radio" value="upi" v-model="state.paymentMethod" aria-label="UPI or Wallet (mock)" />
              <span>UPI/Wallet (mock)</span>
            </label>
          </div>
        </fieldset>

        <div v-if="state.paymentMethod==='card'" class="grid" aria-label="Card details (mock)">
          <label class="full">
            <span>Cardholder name</span>
            <input v-model.trim="state.card.cardholder" autocomplete="cc-name" />
          </label>
          <label class="full">
            <span>Card number</span>
            <input v-model.trim="state.card.cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" />
          </label>
          <label>
            <span>Exp. Month</span>
            <input v-model.trim="state.card.expMonth" inputmode="numeric" placeholder="MM" autocomplete="cc-exp-month" />
          </label>
          <label>
            <span>Exp. Year</span>
            <input v-model.trim="state.card.expYear" inputmode="numeric" placeholder="YY" autocomplete="cc-exp-year" />
          </label>
          <label>
            <span>CVV</span>
            <input v-model.trim="state.card.cvv" inputmode="numeric" autocomplete="cc-csc" />
          </label>
        </div>

        <div v-else-if="state.paymentMethod==='upi'" class="grid" aria-label="UPI or Wallet details (mock)">
          <label class="full">
            <span>UPI/Wallet handle</span>
            <input v-model.trim="state.upi.handle" placeholder="user@upi" />
          </label>
        </div>

        <label class="full">
          <span>Order notes (optional)</span>
          <textarea v-model.trim="state.notes" rows="2" placeholder="Any preferences..."></textarea>
        </label>

        <button class="place" type="submit" :disabled="loading">
          {{ loading ? 'Placing order…' : 'Place Order' }}
        </button>
      </form>
    </template>

    <template v-else>
      <div class="success" role="status" aria-live="polite">
        <div class="icon">✅</div>
        <h2>Order placed!</h2>
        <p>Your confirmation number is <strong>{{ successId }}</strong>.</p>
        <p v-if="successEta">Estimated ready/delivery in {{ successEta }} min.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}
h2 { margin-bottom: .25rem; }
.help { color: #6b7280; margin-bottom: .75rem; }

.alert.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  padding: .6rem .8rem;
  border-radius: 10px;
  margin-bottom: .75rem;
}

.form { display: grid; gap: .75rem; }
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: .75rem;
}
@media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }

label { display: grid; gap: .35rem; }
label.full { grid-column: 1 / -1; }
span { font-size: .9rem; color: #374151; }

input, textarea {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .6rem .8rem;
  outline: none;
  background: var(--surface);
}
input:focus, textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
}

.row { display: flex; gap: 1rem; flex-wrap: wrap; }
.radio { display: inline-flex; align-items: center; gap: .35rem; }

fieldset.full {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .6rem .8rem .8rem;
  background: #fbfdff;
}
legend {
  padding: 0 .35rem;
  color: #374151;
  font-size: .9rem;
}

.seg {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface);
}
.seg-btn {
  border: none;
  background: transparent;
  padding: .45rem .8rem;
  cursor: pointer;
}
.seg-btn.active {
  background: var(--primary);
  color: #fff;
}

.place {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: .7rem .9rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 6px 16px rgba(37,99,235,0.25);
}
.place:disabled { opacity: .7; cursor: not-allowed; }

.success { text-align: center; padding: 1rem 0; }
.icon { font-size: 42px; margin-bottom: .5rem; }
</style>
