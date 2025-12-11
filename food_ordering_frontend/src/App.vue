<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import CartSidebar from '@/components/CartSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <section class="content">
        <RouterView />
      </section>
      <aside class="sidebar">
        <CartSidebar />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.app-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
  padding: 1rem;
}

.sidebar {
  position: sticky;
  top: 1rem;
  height: fit-content;
}

@media (min-width: 1024px) {
  .app-main {
    grid-template-columns: 1fr 340px;
    padding: 1.5rem;
  }
  .content {
    padding: 1.25rem;
  }
}

/* Ocean Professional theme tokens */
:root {
  --primary: #2563EB;
  --secondary: #F59E0B;
  --success: #F59E0B;
  --error: #EF4444;
  --bg: #f9fafb;
  --surface: #ffffff;
  --text: #111827;
  --border: #e5e7eb;
}
</style>
