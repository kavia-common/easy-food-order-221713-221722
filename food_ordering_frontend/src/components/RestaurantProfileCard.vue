<script setup lang="ts">
import type { RestaurantProfile } from '@/types/restaurantProfile'
import AddressBlock from './AddressBlock.vue'
import WorkingHours from './WorkingHours.vue'

defineProps<{
  profile: RestaurantProfile
  loading?: boolean
}>()
</script>

<template>
  <div class="card">
    <div v-if="loading" class="skeleton" aria-label="Loading restaurant profile">
      <div class="line w-60"></div>
      <div class="line w-90"></div>
      <div class="line w-70"></div>
    </div>
    <template v-else>
      <header class="header">
        <h2 class="title">{{ profile.name }}</h2>
        <div v-if="profile.cuisineTypes?.length" class="chips" aria-label="Cuisine types">
          <span v-for="c in profile.cuisineTypes" :key="c" class="chip">{{ c }}</span>
        </div>
      </header>

      <p v-if="profile.description" class="desc">{{ profile.description }}</p>

      <section class="grid2">
        <div class="panel">
          <h3 class="panel-title">Contact</h3>
          <ul class="list">
            <li v-if="profile.phone"><span class="label">Phone</span><a :href="`tel:${profile.phone}`" class="link">{{ profile.phone }}</a></li>
            <li v-if="profile.email"><span class="label">Email</span><a :href="`mailto:${profile.email}`" class="link">{{ profile.email }}</a></li>
            <li v-if="profile.website"><span class="label">Website</span><a :href="profile.website" target="_blank" rel="noopener" class="link">{{ profile.website }}</a></li>
          </ul>
        </div>

        <div class="panel">
          <h3 class="panel-title">Address</h3>
          <AddressBlock :address="profile.address" :showCopy="true" @copied="() => {}" />
        </div>
      </section>

      <section class="panel">
        <h3 class="panel-title">Working hours</h3>
        <WorkingHours :hours="profile.workingHours" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.06);
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.title {
  margin: 0;
  color: #111827;
  font-size: 22px;
}
.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.chip {
  background: linear-gradient(to right, rgba(59,130,246,.08), rgba(249,250,251,1));
  border: 1px solid #dbeafe;
  color: #1f2937;
  border-radius: 9999px;
  padding: 4px 10px;
  font-size: 12px;
}
.desc {
  color: #374151;
  margin: 8px 0 14px;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) {
  .grid2 { grid-template-columns: 1fr 1fr; }
}
.panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}
.panel-title {
  margin: 0 0 8px;
  color: #111827;
  font-size: 16px;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  color: #374151;
  display: grid;
  gap: 6px;
}
.label {
  display: inline-block;
  min-width: 70px;
  color: #6b7280;
}
.link {
  color: #2563EB;
  text-decoration: none;
}
.skeleton .line {
  height: 12px;
  background: #e5e7eb;
  border-radius: 9999px;
  margin: 8px 0;
}
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-90 { width: 90%; }
</style>
