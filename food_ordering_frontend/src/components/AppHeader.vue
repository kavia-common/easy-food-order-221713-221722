<template>
  <header class="app-header">
    <div class="wrapper">
      <nav class="nav">
        <RouterLink class="nav-link" to="/">Home</RouterLink>
        <RouterLink class="nav-link" to="/about">About</RouterLink>
        <RouterLink class="nav-link" to="/orders">Orders</RouterLink>
        <RouterLink class="nav-link" to="/analytics">Analytics</RouterLink>
        <RouterLink class="nav-link admin" to="/admin/coupons" aria-label="Admin Coupons">Admin</RouterLink>

        <div class="spacer" aria-hidden="true"></div>

        <RouterLink class="nav-link" to="/notifications" aria-label="Notifications Settings">
          Notifications
        </RouterLink>

        <VoiceSearchButton />

        <RouterLink class="cart" to="/cart" aria-label="Open cart">
          <span class="icon" aria-hidden="true">🛒</span>
          <span v-if="cartCount" class="badge">{{ cartCount }}</span>
        </RouterLink>

        <RouterLink class="checkout" to="/checkout" aria-label="Go to checkout">
          <span class="icon" aria-hidden="true">💳</span>
          <span>Checkout</span>
          <span v-if="cartCount" class="badge small">{{ cartCount }}</span>
        </RouterLink>

        <button class="chat-link" @click="goChat">
          Chat
          <span v-if="unread" class="badge">{{ unread }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import { useCartStore } from '@/stores/cart';

// Lazy-load VoiceSearchButton so any failure in voice APIs doesn't break initial render.
const VoiceSearchButton = defineAsyncComponent({
  loader: () => import('@/components/VoiceSearchButton.vue'),
  // Simple inline loading fallback to avoid layout shift
  loadingComponent: {
    template: '<span class="voice-loading" aria-hidden="true">…</span>',
  },
  // If it errors, render nothing to keep header functional
  errorComponent: {
    template: '<span class="voice-error" style="display:none"></span>',
  },
  delay: 80,
  timeout: 8000,
});

const router = useRouter();
const chats = useChatsStore();
const cart = useCartStore();

const unread = computed(() => chats.totalUnread);
const cartCount = computed(() => cart.count);

function goChat() {
  router.push({ name: 'chat' });
}
</script>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
:root, :host {
  --primary: #2563EB;
  --secondary: #F59E0B;
  --surface: #ffffff;
  --border: #E5E7EB;
  --text: #111827;
}
.wrapper {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 16px;
}
.nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.spacer { flex: 1 1 auto; }
.nav-link {
  padding: 6px 10px;
  border-radius: 8px;
  color: #111827;
  text-decoration: none;
}
.nav-link.router-link-active {
  background: rgba(37,99,235,.1);
  color: #1e4fd6;
}
.nav-link.admin {
  border: 1px dashed #93C5FD;
}
.chat-link {
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
}
.cart, .checkout {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  color: #111827;
}
.checkout {
  background: linear-gradient(180deg, rgba(37,99,235,.10), #fff);
  border-color: #dbeafe;
}
.icon { font-size: 16px; }
.badge {
  background: #F59E0B;
  color: #111827;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
  font-size: 12px;
  margin-left: 2px;
}
.badge.small { font-size: 10px; padding: 1px 6px; }
</style>
