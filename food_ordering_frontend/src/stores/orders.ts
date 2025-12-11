import { defineStore } from 'pinia';
import { fetchOrderById, fetchOrderHistory, fetchInvoice } from '@/services/ordersApi';
import type { Invoice, OrderDetail, OrderSummary } from '@/types/orders';

interface State {
  history: OrderSummary[];
  details: Record<string, OrderDetail>;
  loading: boolean;
  error: string | null;
}

export const useOrdersStore = defineStore('orders', {
  state: (): State => ({
    history: [],
    details: {},
    loading: false,
    error: null,
  }),
  getters: {
    getById: (state) => (id: string): OrderDetail | undefined => state.details[id],
  },
  actions: {
    // PUBLIC_INTERFACE
    async refreshHistory() {
      /** Load history summaries from API or local mock. */
      this.loading = true;
      this.error = null;
      try {
        this.history = await fetchOrderHistory();
      } catch (e: unknown) {
        this.error = (e as Error)?.message ?? 'Failed to load orders';
      } finally {
        this.loading = false;
      }
    },
    // PUBLIC_INTERFACE
    async loadOrder(id: string) {
      /** Load a specific order detail by id and cache it. */
      this.loading = true;
      this.error = null;
      try {
        const data = await fetchOrderById(id);
        if (data) this.details[id] = data;
      } catch (e: unknown) {
        this.error = (e as Error)?.message ?? 'Failed to load order';
      } finally {
        this.loading = false;
      }
    },
    // PUBLIC_INTERFACE
    async loadInvoice(id: string): Promise<Invoice | null> {
      /** Load invoice for order id. */
      try {
        return await fetchInvoice(id);
      } catch {
        return null;
      }
    },
  },
});
