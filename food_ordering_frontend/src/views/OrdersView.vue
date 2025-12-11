<template>
  <main class="orders">
    <header class="hero">
      <h1>Your Orders</h1>
      <RouterLink class="chat-btn" to="/chat">Open Messages</RouterLink>
    </header>
  </main>
</template>

<script setup lang="ts">
</script>

<style scoped>
.orders { padding: 16px; }
.hero { display: flex; align-items: center; justify-content: space-between; }
.chat-btn {
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 8px;
}
</style>
