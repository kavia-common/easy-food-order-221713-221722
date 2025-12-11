<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { submitOrder } from '@/services/api'
import type { OrderPayload } from '@/types'

const cart = useCartStore()
const loading = ref(false)
const successId = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  paymentMethod: 'card' as 'card'|'cod',
  notes: '',
})

async function onSubmit() {
  if (!form.name || !form.address) {
    errorMsg.value = 'Please enter your name and address.'
    return
  }
  if (!cart.lines.length) {
    errorMsg.value = 'Your cart is empty.'
    return
  }
  errorMsg.value = null
  loading.value = true
  const payload: OrderPayload = {
    customer: { name: form.name, email: form.email || undefined, phone: form.phone || undefined, address: form.address },
    items: cart.lines.map(l => ({ id: l.id, qty: l.qty })),
    paymentMethod: form.paymentMethod,
    notes: form.notes || undefined,
  }
  const res = await submitOrder(payload)
  loading.value = false
  if (res.status === 'success') {
    successId.value = res.id
    cart.clear()
  } else {
    errorMsg.value = 'Order failed. Please try again.'
  }
}
</script>

<template>
  <div class="card">
    <template v-if="!successId">
      <h2>Checkout</h2>
      <p class="help">Enter your details to complete the order.</p>

      <div v-if="errorMsg" class="alert error">{{ errorMsg }}</div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="grid">
          <label>
            <span>Name</span>
            <input v-model.trim="form.name" required />
          </label>

          <label>
            <span>Email</span>
            <input type="email" v-model.trim="form.email" placeholder="optional" />
          </label>

          <label>
            <span>Phone</span>
            <input v-model.trim="form.phone" placeholder="optional" />
          </label>

          <label class="full">
            <span>Address</span>
            <textarea v-model.trim="form.address" required rows="3"></textarea>
          </label>

          <label class="full">
            <span>Payment</span>
            <div class="row">
              <label class="radio">
                <input type="radio" value="card" v-model="form.paymentMethod" />
                <span>Card</span>
              </label>
              <label class="radio">
                <input type="radio" value="cod" v-model="form.paymentMethod" />
                <span>Cash on Delivery</span>
              </label>
            </div>
          </label>

          <label class="full">
            <span>Notes</span>
            <textarea v-model.trim="form.notes" rows="2" placeholder="Any preferences..."></textarea>
          </label>
        </div>

        <button class="place" type="submit" :disabled="loading">
          {{ loading ? 'Placing order…' : 'Place Order' }}
        </button>
      </form>
    </template>

    <template v-else>
      <div class="success">
        <div class="icon">✅</div>
        <h2>Order placed!</h2>
        <p>Your confirmation number is <strong>{{ successId }}</strong>.</p>
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

.row { display: flex; gap: 1rem; }
.radio { display: inline-flex; align-items: center; gap: .35rem; }

.place {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: .7rem .9rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
}
.place:disabled { opacity: .7; cursor: not-allowed; }

.success { text-align: center; padding: 1rem 0; }
.icon { font-size: 42px; margin-bottom: .5rem; }
</style>
