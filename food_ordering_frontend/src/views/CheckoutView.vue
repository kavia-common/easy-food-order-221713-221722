<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import PaymentMethodSelector from '@/components/PaymentMethodSelector.vue'
import UPIPaymentModal from '@/components/UPIPaymentModal.vue'
import { useCartStore } from '@/stores/cart'
import { getAvailableMethods, initPayment, startUPIPayment, startCardPayment, selectCOD, tokenizeCard, getUPIDefaults } from '@/services/payments'
import { createOrder, storeLastOrder } from '@/services/orders'

const cart = useCartStore()
const router = useRouter()

const methods = getAvailableMethods()
const method = ref<'upi' | 'card' | 'cod'>(methods.card ? 'card' : methods.upi ? 'upi' : 'cod')

const address = reactive({
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  instructions: '',
})
const contact = reactive({ email: '' })

const errors = ref<string | null>(null)
const cardErrors = ref<string | null>(null)

const upiModalOpen = ref(false)
const upiDeeplink = ref('')

const payable = computed(() => cart.totals.total + Number(cart.deliveryFee || 0) - 0 /* discounts already in totals */)
const isCartEmpty = computed(() => cart.lines.length === 0)

const step = ref<'details' | 'payment'>('details')

// focus management
const formRef = ref<HTMLFormElement | null>(null)
watch(step, async () => {
  await nextTick()
  formRef.value?.querySelector('input,button,select,textarea')?.focus?.()
})

function fmt(n: number) {
  return `$${n.toFixed(2)}`
}

function validateDetails(): boolean {
  errors.value = null
  if (isCartEmpty.value) {
    errors.value = 'Your cart is empty.'
    return false
  }
  if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.postalCode) {
    errors.value = 'Please complete your address details.'
    return false
  }
  return true
}

function validateCardFields(c: any) {
  cardErrors.value = null
  const digits = String(c.cardNumber || '').replace(/\s+/g, '')
  const cvvOk = /^[0-9]{3,4}$/.test(c.cvv || '')
  const expM = Number(c.expMonth)
  const expY = Number(c.expYear)
  if (!c.cardholder || !/^[0-9]{13,19}$/.test(digits) || !cvvOk || !(expM >= 1 && expM <= 12) || !(expY >= 24 && expY <= 40)) {
    cardErrors.value = 'Please enter valid card details (dev-only mock).'
    return false
  }
  return true
}

const card = reactive({ cardholder: '', cardNumber: '', expMonth: '', expYear: '', cvv: '' })
const upi = reactive({ handle: getUPIDefaults().vpa })

async function proceed() {
  if (step.value === 'details') {
    if (!validateDetails()) return
    step.value = 'payment'
    return
  }
  // payment stage
  const init = await initPayment({ orderDraft: { amount: Math.round(payable.value * 100), orderId: undefined } })
  // create mock order in frontend for confirmation
  const order = await createOrder({ address, contact })
  // Payment flow by method
  if (method.value === 'cod') {
    const res = await selectCOD(order.id)
    if (res.ok) {
      storeLastOrder(order)
      cart.clear()
      router.push({ name: 'order-confirmation', params: { orderId: order.id } })
      return
    }
    errors.value = `COD failed: ${res.reason}`
    return
  }
  if (method.value === 'card') {
    if (!validateCardFields(card)) return
    let token: string
    try {
      token = await tokenizeCard(card)
    } catch (e: any) {
      cardErrors.value = e?.message || 'Card tokenize failed'
      return
    }
    const res = await startCardPayment({ amount: init.payableAmount, orderId: order.id, cardToken: token })
    if (res.ok) {
      storeLastOrder(order)
      cart.clear()
      router.push({ name: 'order-confirmation', params: { orderId: order.id } })
      return
    }
    errors.value = `Card payment failed: ${res.reason}`
    return
  }
  if (method.value === 'upi') {
    const res: any = await startUPIPayment({
      provider: 'googlepay',
      amount: init.payableAmount,
      orderId: order.id,
      vpa: upi.handle,
    })
    if (res.reason === 'PENDING_CONFIRMATION' && res.deeplink) {
      upiDeeplink.value = res.deeplink
      upiModalOpen.value = true
      return
    }
    if (res.ok) {
      storeLastOrder(order)
      cart.clear()
      router.push({ name: 'order-confirmation', params: { orderId: order.id } })
    } else {
      errors.value = `UPI error: ${res.reason}`
    }
    return
  }
}

function handleUPIConfirmed() {
  upiModalOpen.value = false
  // Assume paid for mock flow
  const order = JSON.parse(window.localStorage.getItem('last_order_receipt_v1') || 'null')
  if (order?.id) {
    cart.clear()
    router.push({ name: 'order-confirmation', params: { orderId: order.id } })
  } else {
    // fallback: go to orders
    router.push({ name: 'orders' })
  }
}

onMounted(() => {
  if (isCartEmpty.value) {
    errors.value = 'Your cart is empty.'
  }
})
</script>

<template>
  <div class="grid">
    <section class="left">
      <div class="card">
        <h2>Checkout</h2>
        <p class="help">Enter address and choose a payment method.</p>

        <div v-if="errors" class="alert error" role="alert">{{ errors }}</div>
        <div v-if="cardErrors" class="alert error" role="alert">{{ cardErrors }}</div>

        <form ref="formRef" @submit.prevent="proceed" class="form" aria-labelledby="checkout-form">
          <h3 id="checkout-form">Address & Contact</h3>
          <div class="grid-fields" aria-label="Address form">
            <label>
              <span>Full name</span>
              <input v-model.trim="address.fullName" required aria-required="true" />
            </label>
            <label>
              <span>Phone</span>
              <input v-model.trim="address.phone" required aria-required="true" />
            </label>
            <label class="full">
              <span>Address line 1</span>
              <input v-model.trim="address.line1" required aria-required="true" />
            </label>
            <label class="full">
              <span>Address line 2</span>
              <input v-model.trim="address.line2" />
            </label>
            <label>
              <span>City</span>
              <input v-model.trim="address.city" required aria-required="true" />
            </label>
            <label>
              <span>State</span>
              <input v-model.trim="address.state" />
            </label>
            <label>
              <span>Postal code</span>
              <input v-model.trim="address.postalCode" required aria-required="true" />
            </label>
            <label class="full">
              <span>Delivery instructions (optional)</span>
              <textarea v-model.trim="address.instructions" rows="2" />
            </label>

            <label class="full">
              <span>Email (for receipt)</span>
              <input v-model.trim="contact.email" type="email" placeholder="you@example.com" />
            </label>
          </div>

          <div class="divider" role="separator" aria-orientation="horizontal"></div>

          <h3>Payment Method</h3>
          <PaymentMethodSelector v-model="method" />

          <div v-if="method==='card'" class="grid-fields" aria-label="Card details (mock)">
            <div class="disclaimer">Dev-only: card form is a mock for UI. Do not enter real card data.</div>
            <label class="full">
              <span>Cardholder name</span>
              <input v-model.trim="card.cardholder" autocomplete="cc-name" />
            </label>
            <label class="full">
              <span>Card number</span>
              <input v-model.trim="card.cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" />
            </label>
            <label>
              <span>Exp. Month</span>
              <input v-model.trim="card.expMonth" inputmode="numeric" placeholder="MM" autocomplete="cc-exp-month" />
            </label>
            <label>
              <span>Exp. Year</span>
              <input v-model.trim="card.expYear" inputmode="numeric" placeholder="YY" autocomplete="cc-exp-year" />
            </label>
            <label>
              <span>CVV</span>
              <input v-model.trim="card.cvv" inputmode="numeric" autocomplete="cc-csc" />
            </label>
          </div>

          <div v-else-if="method==='upi'" class="grid-fields" aria-label="UPI">
            <label class="full">
              <span>UPI ID</span>
              <input v-model.trim="upi.handle" placeholder="user@upi" />
            </label>
            <div class="note">We'll open your UPI app or show a QR to scan.</div>
          </div>

          <div v-else-if="method==='cod'" class="cod">
            <p>Pay with cash upon delivery. Please ensure correct address and phone.</p>
          </div>

          <div class="actions">
            <button type="submit" class="primary" :disabled="isCartEmpty">
              {{ step==='details' ? 'Continue to payment' : (method==='cod' ? 'Confirm Order' : 'Pay') }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <aside class="right">
      <div class="card" aria-label="Order summary">
        <h3>Order Summary</h3>
        <div class="row"><span>Items</span><span>{{ cart.count }}</span></div>
        <div class="row"><span>Subtotal</span><span>{{ fmt(cart.totals.subtotal) }}</span></div>
        <div class="row" v-if="cart.discount>0"><span>Discount</span><span>-{{ fmt(cart.discount) }}</span></div>
        <div class="row"><span>Tax</span><span>{{ fmt(cart.tax) }}</span></div>
        <div class="row"><span>Delivery</span><span>{{ fmt(cart.deliveryFee || 0) }}</span></div>
        <div class="row total"><span>Total payable</span><span>{{ fmt(payable) }}</span></div>
        <p v-if="cart.appliedCouponCode" class="applied" aria-live="polite">Coupon applied: <strong>{{ cart.appliedCouponCode }}</strong></p>
      </div>
    </aside>
  </div>

  <UPIPaymentModal :open="upiModalOpen" :deeplink="upiDeeplink" @close="upiModalOpen=false" @confirmed="handleUPIConfirmed" />
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 1024px) { .grid { grid-template-columns: 1fr 320px; } }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}
h2 { margin-bottom: .25rem; }
h3 { margin: .25rem 0 .25rem; }
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
.grid-fields {
  display: grid; grid-template-columns: 1fr; gap: .75rem;
}
@media (min-width: 640px) { .grid-fields { grid-template-columns: 1fr 1fr; } }
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
input:focus, textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }
.divider { height: 1px; background: var(--border); margin: .25rem 0 .5rem; }
.actions { display: flex; justify-content: flex-end; }
.primary {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: .7rem .9rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(37,99,235,0.25);
}
.right .row { display: flex; justify-content: space-between; padding: .25rem 0; color: #374151; }
.total { font-weight: 800; color: var(--text); }
.applied { margin-top: .4rem; color: #374151; font-size: .9rem; }
.disclaimer { grid-column: 1 / -1; background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: .5rem .6rem; border-radius: 10px; }
.note { grid-column: 1 / -1; color: #374151; font-size: .9rem; }
.cod p { color: #374151; }
</style>
