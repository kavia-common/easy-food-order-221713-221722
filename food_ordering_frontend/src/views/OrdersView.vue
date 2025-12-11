<template>
  <main class="container">
    <header class="page-header">
      <h1>Order History</h1>
      <p class="subtitle">View and manage your past orders.</p>
    </header>

    <section class="controls">
      <label>
        Status
        <select v-model="statusFilter">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="out_for_delivery">Out for delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label>
        From
        <input type="date" v-model="fromDate" />
      </label>
      <label>
        To
        <input type="date" v-model="toDate" />
      </label>
    </section>

    <section v-if="ordersStore.loading" aria-busy="true" class="skeleton-list">
      <div class="skeleton-card" v-for="i in 4" :key="i"></div>
    </section>

    <section v-else>
      <ul class="order-list" v-if="paged.length">
        <li v-for="o in paged" :key="o.id" class="order-card">
          <div class="meta">
            <h3>
              <RouterLink :to="`/orders/${o.id}`" class="order-link">
                {{ o.restaurantName }}
              </RouterLink>
            </h3>
            <div class="sub">
              <span class="badge" :data-status="o.status">{{ prettyStatus(o.status) }}</span>
              <span>•</span>
              <span>{{ new Date(o.placedAt).toLocaleString() }}</span>
              <span>•</span>
              <span>{{ o.lineCount }} items</span>
            </div>
          </div>
          <div class="amount">
            <strong>{{ formatMoney(o.total.amount, o.total.currency) }}</strong>
            <div class="actions">
              <button class="btn-outline" @click="reorder(o.id)">Reorder</button>
              <RouterLink :to="`/orders/${o.id}`" class="btn-primary">View</RouterLink>
            </div>
          </div>
        </li>
      </ul>

      <p v-else class="empty">No orders found.</p>

      <footer class="pager" v-if="pages > 1">
        <button class="btn-outline" :disabled="page===1" @click="page--">Prev</button>
        <span>Page {{ page }} / {{ pages }}</span>
        <button class="btn-outline" :disabled="page===pages" @click="page++">Next</button>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import type { OrderStatus } from '@/types/orders';
import { useCartStore } from '@/stores/cart';

const ordersStore = useOrdersStore();
const cartStore = useCartStore();

const statusFilter = ref<string>('');
const fromDate = ref<string>('');
const toDate = ref<string>('');
const page = ref(1);
const pageSize = 8;

onMounted(() => {
  ordersStore.refreshHistory();
});

const filtered = computed(() => {
  const s = statusFilter.value as OrderStatus | '';
  const from = fromDate.value ? new Date(fromDate.value) : null;
  const to = toDate.value ? new Date(toDate.value) : null;
  return ordersStore.history.filter((o) => {
    if (s && o.status !== s) return false;
    const placed = new Date(o.placedAt);
    if (from && placed < from) return false;
    if (to) {
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      if (placed > toEnd) return false;
    }
    return true;
  });
});

const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const paged = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

function prettyStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(+amount.toFixed(2));
}

async function reorder(orderId: string) {
  // Load detail to get lines; merge into cart
  await ordersStore.loadOrder(orderId);
  const detail = ordersStore.getById(orderId);
  if (!detail) return;
  for (const l of detail.lines) {
    // Merge into cart lines by id; fall back to pushing new line
    const existing = cartStore.lines.find((x) => x.id === l.itemId);
    if (existing) {
      existing.qty += l.quantity;
    } else {
      cartStore.lines.push({
        id: l.itemId,
        name: l.name,
        price: l.unitPrice.amount,
        image: l.imageUrl || '',
        qty: l.quantity,
      });
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}
.page-header h1 {
  font-size: 1.5rem;
  margin: 0 0 0.25rem 0;
  color: #111827;
}
.subtitle {
  color: #6b7280;
  margin: 0 0 1rem 0;
}
.controls {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
.controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  font-size: 0.9rem;
}
.order-list {
  display: grid;
  gap: 0.75rem;
}
.order-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
}
.meta h3 {
  margin: 0;
  font-size: 1rem;
}
.order-link {
  text-decoration: none;
  color: #111827;
}
.sub {
  display: flex;
  gap: 0.5rem;
  color: #6b7280;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}
.badge {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  background: #f9fafb;
}
.badge[data-status="delivered"] {
  border-color: #10b98133;
  background: #10b98111;
}
.amount {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.btn-primary {
  background: #2563EB;
  color: white;
  border: 1px solid #1d4ed8;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
}
.btn-outline {
  background: white;
  color: #2563EB;
  border: 1px solid #2563EB;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
}
.pager {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}
.empty {
  color: #6b7280;
  padding: 1rem;
  text-align: center;
}
.skeleton-list {
  display: grid;
  gap: 0.75rem;
}
.skeleton-card {
  height: 68px;
  border-radius: 0.75rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
