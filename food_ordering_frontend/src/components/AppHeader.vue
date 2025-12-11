<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRouter, useRoute } from 'vue-router'
import { featureFlags } from '@/services/api'

const cart = useCartStore()
const router = useRouter()
const route = useRoute()
const enableSearch = featureFlags.enableSearch ?? true

const q = ref<string>((route.query.q as string) || '')

watch(q, (val) => {
  const query = { ...route.query }
  if (val) query.q = val
  else delete query.q
  if (route.name === 'home') {
    router.replace({ name: 'home', query })
  }
})
const cartCount = computed(() => cart.count)
</script>

<template>
  <header class="header">
    <div class="inner">
      <div class="brand" @click="router.push('/')">
        <div class="logo">🍽️</div>
        <div class="meta">
          <h1>Ocean Eats</h1>
          <p>Simple online ordering</p>
        </div>
      </div>

      <div v-if="enableSearch" class="search">
        <input v-model.trim="q" type="search" placeholder="Search menu..." />
      </div>

      <nav class="actions">
        <a class="nav-link" href="#" @click.prevent="router.push('/restaurants')" aria-label="Browse restaurants">Restaurants</a>
        <button class="cart-btn" @click="router.push('/cart')">
          Cart
          <span v-if="cartCount" class="badge">{{ cartCount }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(90deg, rgba(37,99,235,0.08), rgba(249,250,251,1));
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(6px);
}

.inner {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: .75rem 1rem;
}

.brand {
  display: flex;
  gap: .75rem;
  align-items: center;
  cursor: pointer;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--surface);
  display: grid;
  place-items: center;
  box-shadow: 0 4px 12px rgba(37,99,235,0.15);
}

.meta h1 {
  font-size: 1rem;
  margin: 0;
  color: var(--text);
}
.meta p {
  margin: 0;
  font-size: .75rem;
  color: #6b7280;
}

.search input {
  width: clamp(180px, 30vw, 420px);
  padding: .6rem .8rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  outline: none;
  transition: box-shadow .2s, border-color .2s;
  background: var(--surface);
}
.search input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, .12);
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: .75rem;
}
.actions .nav-link {
  color: var(--text);
  padding: .45rem .6rem;
  border-radius: 10px;
  border: 1px solid transparent;
}
.actions .nav-link:focus, .actions .nav-link:hover {
  border-color: var(--border);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.08);
  outline: none;
}
.actions .cart-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: .6rem .9rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  box-shadow: 0 6px 16px rgba(37,99,235,0.25);
}
.badge {
  background: var(--secondary);
  color: #111827;
  padding: .1rem .45rem;
  border-radius: 999px;
  font-size: .75rem;
}
</style>
