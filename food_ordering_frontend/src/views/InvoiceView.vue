<template>
  <main class="container">
    <header class="page-header no-print">
      <h1>Invoice</h1>
      <div class="actions">
        <RouterLink class="btn-outline" :to="`/orders/${id}`">Back</RouterLink>
        <button class="btn-primary" @click="printInvoice">Print / Download</button>
      </div>
    </header>

    <section v-if="!invoice" class="skeleton">
      <div class="skeleton-card"></div>
    </section>

    <section v-else class="invoice" id="invoice">
      <div class="head">
        <div>
          <h2>{{ invoice.restaurantName }}</h2>
          <p>Invoice #: {{ invoice.invoiceNumber }}</p>
          <p>Order #: {{ invoice.orderId }}</p>
          <p>Issued: {{ new Date(invoice.issuedAt).toLocaleString() }}</p>
        </div>
        <div>
          <h3>Billed To</h3>
          <address>
            <div>{{ invoice.billedTo.fullName }}</div>
            <div>{{ invoice.billedTo.line1 }}</div>
            <div v-if="invoice.billedTo.line2">{{ invoice.billedTo.line2 }}</div>
            <div>{{ invoice.billedTo.city }} {{ invoice.billedTo.state }} {{ invoice.billedTo.postalCode }}</div>
            <div>{{ invoice.billedTo.country }}</div>
          </address>
        </div>
      </div>

      <table class="lines">
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
        </thead>
        <tbody>
          <tr v-for="(l, idx) in invoice.lines" :key="idx">
            <td>{{ l.description }}</td>
            <td class="num">{{ l.quantity }}</td>
            <td class="num">{{ formatMoney(l.unitPrice.amount, l.unitPrice.currency) }}</td>
            <td class="num">{{ formatMoney(l.lineTotal.amount, l.lineTotal.currency) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div><span>Subtotal</span><span>{{ formatMoney(invoice.totals.subtotal.amount, invoice.totals.subtotal.currency) }}</span></div>
        <div v-if="invoice.totals.discount"><span>Discount</span><span>-{{ formatMoney(invoice.totals.discount.amount, invoice.totals.discount.currency) }}</span></div>
        <div><span>Tax</span><span>{{ formatMoney(invoice.totals.tax.amount, invoice.totals.tax.currency) }}</span></div>
        <div v-if="invoice.totals.deliveryFee"><span>Delivery</span><span>{{ formatMoney(invoice.totals.deliveryFee.amount, invoice.totals.deliveryFee.currency) }}</span></div>
        <div v-if="invoice.totals.tip"><span>Tip</span><span>{{ formatMoney(invoice.totals.tip.amount, invoice.totals.tip.currency) }}</span></div>
        <div class="grand"><span>Total</span><span>{{ formatMoney(invoice.totals.total.amount, invoice.totals.total.currency) }}</span></div>
      </div>

      <footer class="foot">
        <p>Payment: {{ invoice.payment.method.toUpperCase() }} <span v-if="invoice.payment.brand">({{ invoice.payment.brand }})</span> <span v-if="invoice.payment.last4">•••• {{ invoice.payment.last4 }}</span> — <strong>{{ invoice.payment.paid ? 'Paid' : 'Unpaid' }}</strong></p>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useOrdersStore } from '@/stores/orders';
import type { Invoice } from '@/types/orders';

const route = useRoute();
const id = route.params.id as string;
const orders = useOrdersStore();

const invoice = ref<Invoice | null>(null);

onMounted(async () => {
  invoice.value = await orders.loadInvoice(id);
});

function printInvoice() {
  window.print();
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(+amount.toFixed(2));
}
</script>

<style scoped>
.container { max-width: 900px; margin: 0 auto; padding: 1rem; background: var(--bg, #fff); }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.btn-primary {
  background: #2563EB; color: white; border: 1px solid #1d4ed8;
  padding: 0.375rem 0.75rem; border-radius: 0.5rem;
}
.btn-outline {
  background: white; color: #2563EB; border: 1px solid #2563EB;
  padding: 0.375rem 0.75rem; border-radius: 0.5rem;
}
.invoice {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
}
.head {
  display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.75rem; margin-bottom: 0.75rem;
}
.lines { width: 100%; border-collapse: collapse; }
.lines th, .lines td { border-bottom: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
.lines th:nth-child(2), .lines th:nth-child(3), .lines th:nth-child(4) { text-align: right; }
.num { text-align: right; }
.totals { margin-top: 0.75rem; display: grid; gap: 0.25rem; }
.totals > div { display: flex; justify-content: space-between; }
.totals .grand { font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 0.5rem; }
.foot { border-top: 1px solid #e5e7eb; margin-top: 1rem; padding-top: 0.5rem; color: #374151; }

.skeleton-card {
  height: 200px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 0.75rem;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* Print styles */
@media print {
  .no-print { display: none !important; }
  .container { padding: 0; }
  .invoice {
    border: none;
    padding: 0;
  }
}
</style>
