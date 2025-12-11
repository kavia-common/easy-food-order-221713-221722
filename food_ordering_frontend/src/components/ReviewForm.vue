<template>
  <form @submit.prevent="onSubmit" class="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-700 min-w-20">Your rating</label>
      <StarRating v-model="rating" :show-value="true" aria-label="Your rating" />
    </div>
    <div class="mt-3">
      <label class="block text-sm text-gray-700 mb-1" for="comment">Your review</label>
      <textarea
        id="comment"
        v-model="comment"
        rows="3"
        class="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Share your experience…"
      />
    </div>
    <div class="mt-2 text-xs text-red-600" v-if="errors.length">
      <ul class="list-disc ml-5">
        <li v-for="(e, idx) in errors" :key="idx">{{ e }}</li>
      </ul>
    </div>
    <div class="mt-4 flex items-center gap-3">
      <button
        type="submit"
        class="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        :disabled="submitting"
      >
        {{ submitLabel }}
      </button>
      <span v-if="submitting" class="text-sm text-gray-500">Submitting…</span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import StarRating from './StarRating.vue';

const props = withDefaults(
  defineProps<{
    initialRating?: number;
    initialComment?: string;
    submitLabel?: string;
  }>(),
  {
    initialRating: 0,
    initialComment: '',
    submitLabel: 'Submit review',
  },
);

const emit = defineEmits<{
  (e: 'submit', payload: { rating: number; comment: string }): void;
}>();

const rating = ref<number>(props.initialRating);
const comment = ref<string>(props.initialComment);
const submitting = ref(false);
const errors = ref<string[]>([]);

watch(
  () => [props.initialRating, props.initialComment] as const,
  ([r, c]) => {
    rating.value = Number.isFinite(r) ? (r as number) : 0;
    comment.value = typeof c === 'string' ? c : '';
  },
);

function validate() {
  const errs: string[] = [];
  if (!rating.value || rating.value <= 0) {
    errs.push('Rating is required.');
  }
  if (!comment.value || comment.value.trim().length < 10) {
    errs.push('Comment must be at least 10 characters.');
  }
  errors.value = errs;
  return errs.length === 0;
}

async function onSubmit() {
  if (!validate()) return;
  submitting.value = true;
  try {
    emit('submit', { rating: rating.value, comment: comment.value.trim() });
  } finally {
    setTimeout(() => {
      submitting.value = false;
    }, 50);
  }
}
</script>

<style scoped>
</style>
