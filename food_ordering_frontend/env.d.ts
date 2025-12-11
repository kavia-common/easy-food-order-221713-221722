/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_DELIVERY_BASE_FEE?: string;
  readonly VITE_DELIVERY_RUSH_SURCHARGE?: string;
  readonly VITE_DELIVERY_WEEKEND_SURCHARGE?: string;
  readonly VITE_RUSH_HOURS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
