<script lang="ts">
import { defineComponent, h } from 'vue'

/**
 * PUBLIC_INTERFACE
 * A minimal error boundary that catches rendering errors in its slot content
 * and shows a friendly fallback UI instead of leaving the page blank.
 */
export default defineComponent({
  name: 'ErrorBoundary',
  data() {
    return {
      hasError: false as boolean,
      errorMessage: '' as string,
    }
  },
  errorCaptured(err: unknown) {
    this.hasError = true
    try {
      this.errorMessage = err instanceof Error ? err.message : String(err)
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Caught error:', err)
    } catch {
      // ignore
    }
    // Return false to propagate error to parents as well if needed; true swallows it.
    return false
  },
  render() {
    if (this.hasError) {
      return h(
        'div',
        { class: 'error-boundary' },
        [
          h('h2', { class: 'title' }, 'Something went wrong'),
          h('p', { class: 'desc' }, 'The page failed to render. Please try again or check the console.'),
          this.errorMessage ? h('pre', { class: 'details' }, this.errorMessage) : null,
        ]
      )
    }
    // @ts-ignore Render default slot
    return this.$slots.default ? this.$slots.default() : null
  },
})
</script>

<style scoped>
.error-boundary {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
  padding: 14px;
  border-radius: 12px;
  margin: 12px 0;
}
.title {
  margin: 0 0 6px 0;
  font-size: 16px;
}
.desc {
  margin: 0 0 8px 0;
}
.details {
  margin: 0;
  background: #fff;
  color: #991b1b;
  border-radius: 8px;
  padding: 8px;
  overflow: auto;
  max-height: 160px;
  font-size: 12px;
}
</style>
