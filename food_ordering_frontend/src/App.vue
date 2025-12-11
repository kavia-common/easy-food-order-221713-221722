<script setup lang="ts">
// Import AppHeader in the same setup context so it's available in the template
import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
  <div id="app">
    <header>
      <AppHeader />
    </header>
    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(37,99,235,0.06), rgba(249,250,251,1));
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}
</style>
