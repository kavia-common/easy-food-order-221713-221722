<template>
  <form class="review-form card" @submit.prevent="onSubmit" aria-live="polite">
    <div class="field">
      <label class="label" for="stars">Your rating</label>
      <RatingStars
        id="stars"
        v-model="stars"
        :disabled="submitting"
        :help="'Use arrow keys to adjust rating.'"
      />
      <div class="hint">Selected: {{ stars }} / 5</div>
    </div>

    <div class="field">
      <label class="label" for="comment">Your review</label>
      <textarea
        id="comment"
        class="textarea"
        :maxlength="maxLen"
        :disabled="submitting"
        v-model="commentInput"
        @input="onType"
        placeholder="Share your experience..."
        rows="4"
      />
      <div class="counter">{{ comment.length }} / {{ maxLen }}</div>
    </div>

    <div class="actions">
      <button type="submit" class="btn primary" :disabled="submitting || !canSubmit">Submit</button>
      <button type="button" class="btn" :disabled="submitting" @click="$emit('cancel')">Cancel</button>
    </div>

    <p v-if="error" class="msg error" role="alert">{{ error }}</p>
    <p v-if="success" class="msg success" role="status">Thank you for your review!</p>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import RatingStars from './RatingStars.vue';

interface Props {
  maxLen?: number;
  initialStars?: number;
  initialComment?: string;
  submitting?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  maxLen: 1000,
  initialStars: 5,
  initialComment: '',
  submitting: false,
});

const emit = defineEmits<{
  (e: 'submit', payload: { stars: number; comment: string }): void;
  (e: 'cancel'): void;
}>();

const stars = ref(Math.min(5, Math.max(1, Math.round(props.initialStars))));
const comment = ref(props.initialComment || '');
const commentInput = ref(comment.value); // for debounce typing
const error = ref('');
const success = ref(false);
const typingTimeout = ref<number | undefined>(undefined);

const canSubmit = computed(() => {
  const trimmed = comment.value.trim();
  return stars.value >= 1 && stars.value <= 5 && trimmed.length >= 5;
});

function onType() {
  if (typingTimeout.value) {
    window.clearTimeout(typingTimeout.value);
  }
  const current = commentInput.value;
  typingTimeout.value = window.setTimeout(() => {
    comment.value = current;
  }, 200);
}

async function onSubmit() {
  error.value = '';
  success.value = false;
  if (!canSubmit.value) {
    error.value = 'Please add a rating (1-5) and a comment of at least 5 characters.';
    return;
  }
  emit('submit', { stars: stars.value, comment: comment.value.trim() });
}
</script>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 6px 16px rgba(17,24,39,0.06);
}
.field {
  margin-bottom: 0.75rem;
}
.label {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
  display: inline-block;
}
.hint {
  color: #6b7280;
  font-size: 0.875rem;
}
.textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  outline: none;
  transition: box-shadow .15s ease, border-color .15s ease;
}
.textarea:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(147,197,253,.25);
}
.counter {
  text-align: right;
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.btn {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #1f2937;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.btn.primary {
  background: linear-gradient(to bottom right, rgba(37,99,235,0.1), rgba(245,158,11,0.1));
  border-color: #93c5fd;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.msg {
  margin-top: 0.5rem;
}
.msg.error {
  color: #EF4444;
}
.msg.success {
  color: #2563EB;
}
</style>
