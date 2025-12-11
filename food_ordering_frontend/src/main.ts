import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index';

import './assets/base.css';
import './assets/main.css';

const app = createApp(App);

// Minimal diagnostics helpful for preview without breaking render
try {
  // eslint-disable-next-line no-console
  console.debug('Environment snapshot', {
    BASE_URL: import.meta.env.BASE_URL,
    VITE_API_BASE: import.meta.env.VITE_API_BASE,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
  });
} catch {
  // ignore
}

app.use(createPinia());
try {
  app.use(router);
} catch {
  // If router initialization fails for any reason, proceed with app mounting to show fallback content
}
try {
  app.mount('#app');
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Failed to mount Vue app', e);
}

// Defensive, non-blocking SW registration
(function registerSW() {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[main] SW registration failed:', err);
      });
      // @ts-ignore expose for debugging
      (window as any).__registerSW = () => navigator.serviceWorker.register('/sw.js');
    }
  } catch {
    // ignore
  }
})();
