# Ocean Eats Frontend - Preview and Environment

This app is built with Vite + Vue 3 + Pinia + Vue Router.

Preview behavior:
- The app mounts on the DOM element with id="app".
- Router uses HTML5 history with BASE_URL (defaults to '/'), compatible with the preview environment.
- When environment variables are missing or invalid, all services gracefully fall back to mock/local implementations so the UI renders without contacting any backend.

Environment variables (configure via .env):
- VITE_API_BASE: Base URL for HTTP API (e.g., https://api.example.com). Optional for preview.
- VITE_BACKEND_URL: Alternative base URL checked if VITE_API_BASE is not set.
- VITE_FRONTEND_URL: Public URL of the frontend (optional).
- VITE_WS_URL: WebSocket URL for chat (optional).
- VITE_FEATURE_FLAGS: JSON or comma-separated flags. Example:
  - JSON: {"enableNetwork":false,"enableMockAPI":true}
  - CSV: enableNetwork=true,enableMockAPI=true

Fallbacks:
- If VITE_API_BASE/VITE_BACKEND_URL are not set or invalid, services use mock data.
- WebSocket chat is disabled unless VITE_WS_URL is set and valid.
- Orders API falls back to a mock success response in preview.

Troubleshooting:
- Ensure the preview host is accessible at port 3000 (vite.config.ts uses host 0.0.0.0 and strictPort).
- If you see network errors in the console but the UI renders, they are expected in preview without a backend.
