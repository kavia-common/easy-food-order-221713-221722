<script setup lang="ts">
import { ref } from 'vue'
import type { NutritionFacts } from '@/types'

defineProps<{
  nutrition?: NutritionFacts
}>()

const open = ref(false)
</script>

<template>
  <section v-if="nutrition" class="panel">
    <button
      class="toggle"
      :aria-expanded="open"
      aria-controls="nutrition-content"
      @click="open = !open"
    >
      Nutrition facts
      <span class="chev" :class="{ open }">▾</span>
    </button>

    <div v-show="open" id="nutrition-content" class="content">
      <div class="row">
        <span>Calories</span><span>{{ nutrition.calories }} kcal</span>
      </div>
      <div class="row">
        <span>Protein</span><span>{{ nutrition.protein }} g</span>
      </div>
      <div class="row">
        <span>Carbs</span><span>{{ nutrition.carbs }} g</span>
      </div>
      <div class="row">
        <span>Fat</span><span>{{ nutrition.fat }} g</span>
      </div>
      <div v-if="nutrition.fiber !== undefined" class="row">
        <span>Fiber</span><span>{{ nutrition.fiber }} g</span>
      </div>
      <div v-if="nutrition.sugar !== undefined" class="row">
        <span>Sugar</span><span>{{ nutrition.sugar }} g</span>
      </div>
      <div v-if="nutrition.sodium !== undefined" class="row">
        <span>Sodium</span><span>{{ nutrition.sodium }} mg</span>
      </div>

      <div v-if="nutrition.allergens?.length" class="allergens" role="note" aria-label="Allergens">
        <strong>Allergens:</strong>
        <ul>
          <li v-for="a in nutrition.allergens" :key="a">{{ a }}</li>
        </ul>
      </div>

      <div v-if="nutrition.tags?.length" class="tags">
        <span v-for="t in nutrition.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  margin-top: .5rem;
}
.toggle {
  width: 100%;
  text-align: left;
  padding: .6rem .8rem;
  background: #F3F4F6;
  border: none;
  border-bottom: 1px solid var(--border);
  border-radius: 12px 12px 0 0;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.chev { transition: transform .15s ease; }
.chev.open { transform: rotate(180deg); }
.content { padding: .6rem .8rem; display: grid; gap: .35rem; }
.row { display: flex; justify-content: space-between; color: #374151; }
.allergens { margin-top: .4rem; color: #991B1B; }
.allergens ul { margin: .25rem 0 0; padding-left: 1.2rem; }
.tags { margin-top: .4rem; display: flex; gap: .4rem; flex-wrap: wrap; }
.tag {
  background: #EFF6FF;
  color: #1E3A8A;
  border: 1px solid #BFDBFE;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}
</style>
