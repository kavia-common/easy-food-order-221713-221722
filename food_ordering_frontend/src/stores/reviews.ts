import { defineStore } from 'pinia';
import {
  fetchDeliveryReviews,
  fetchRestaurantReviews,
  submitDeliveryReview,
  submitRestaurantReview,
} from '@/services/ratingsApi';
import type {
  DeliveryReview,
  RatingSummary,
  RestaurantReview,
  SubmitDeliveryReviewPayload,
  SubmitRestaurantReviewPayload,
} from '@/types/reviews';

type EntityId = string;

interface ReviewsState {
  restaurantSummaries: Record<EntityId, RatingSummary | undefined>;
  restaurantRecent: Record<EntityId, RestaurantReview[]>;
  deliverySummariesByPerson: Record<EntityId, RatingSummary | undefined>;
  deliveryRecentByPerson: Record<EntityId, DeliveryReview[]>;
  deliveryByOrder: Record<EntityId, DeliveryReview | undefined>;
  loading: Record<string, boolean>;
  errors: Record<string, string | undefined>;
}

export const useReviewsStore = defineStore('reviews', {
  state: (): ReviewsState => ({
    restaurantSummaries: {},
    restaurantRecent: {},
    deliverySummariesByPerson: {},
    deliveryRecentByPerson: {},
    deliveryByOrder: {},
    loading: {},
    errors: {},
  }),
  actions: {
    setLoading(key: string, v: boolean) {
      this.loading[key] = v;
    },
    setError(key: string, msg?: string) {
      this.errors[key] = msg;
    },

    // PUBLIC_INTERFACE
    async loadRestaurantReviews(restaurantId: string, limit = 10) {
      /** Loads and caches restaurant review summary and recent reviews. */
      const key = `rest:${restaurantId}`;
      this.setLoading(key, true);
      try {
        const res = await fetchRestaurantReviews(restaurantId, limit);
        this.restaurantSummaries[restaurantId] = res.summary;
        this.restaurantRecent[restaurantId] = res.reviews;
        this.setError(key, undefined);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load reviews';
        this.setError(key, msg);
      } finally {
        this.setLoading(key, false);
      }
    },

    // PUBLIC_INTERFACE
    async submitRestaurantReviewOptimistic(payload: SubmitRestaurantReviewPayload) {
      /** Optimistically adds a restaurant review and rolls back on failure. */
      const rid = payload.restaurantId;
      const key = `rest:submit:${rid}`;
      const prevList = this.restaurantRecent[rid] || [];
      const prevSummary = this.restaurantSummaries[rid];

      // optimistic
      const nowIso = new Date().toISOString();
      const tempReview: RestaurantReview = {
        id: 'temp_' + Math.random().toString(36).slice(2),
        restaurantId: rid,
        author: payload.author,
        rating: payload.rating,
        comment: payload.comment,
        orderId: payload.orderId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.restaurantRecent[rid] = [tempReview, ...prevList];

      // adjust summary optimistic
      if (prevSummary) {
        const count = prevSummary.count + 1;
        const total = prevSummary.average * prevSummary.count + payload.rating;
        const avg = Math.round((total / count) * 10) / 10;
        const bucket = Math.max(1, Math.min(5, Math.round(payload.rating))) as 1 | 2 | 3 | 4 | 5;
        this.restaurantSummaries[rid] = {
          average: avg,
          count,
          breakdown: {
            ...prevSummary.breakdown,
            [bucket]: prevSummary.breakdown[bucket] + 1,
          },
        };
      }

      this.setLoading(key, true);
      try {
        const created = await submitRestaurantReview(payload);
        // replace temp with actual
        this.restaurantRecent[rid] = this.restaurantRecent[rid].map((r) =>
          r.id === tempReview.id ? created : r,
        );
        this.setError(key, undefined);
      } catch (e) {
        // rollback
        this.restaurantRecent[rid] = prevList;
        this.restaurantSummaries[rid] = prevSummary;
        const msg = e instanceof Error ? e.message : 'Failed to submit review';
        this.setError(key, msg);
      } finally {
        this.setLoading(key, false);
      }
    },

    // PUBLIC_INTERFACE
    async loadDeliveryReviewsByPerson(deliveryPersonId: string, limit = 10) {
      /** Loads delivery reviews for a person with summary and caches them. */
      const key = `del:person:${deliveryPersonId}`;
      this.setLoading(key, true);
      try {
        const res = await fetchDeliveryReviews({ deliveryPersonId }, limit);
        this.deliverySummariesByPerson[deliveryPersonId] = res.summary;
        this.deliveryRecentByPerson[deliveryPersonId] = res.reviews;
        this.setError(key, undefined);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load delivery reviews';
        this.setError(key, msg);
      } finally {
        this.setLoading(key, false);
      }
    },

    // PUBLIC_INTERFACE
    async loadDeliveryReviewByOrder(orderId: string) {
      /** Loads the delivery review for a specific order (single review if exists). */
      const key = `del:order:${orderId}`;
      this.setLoading(key, true);
      try {
        const res = await fetchDeliveryReviews({ orderId }, 1);
        this.deliveryByOrder[orderId] = res.reviews[0];
        this.setError(key, undefined);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load order delivery review';
        this.setError(key, msg);
      } finally {
        this.setLoading(key, false);
      }
    },

    // PUBLIC_INTERFACE
    async submitDeliveryReviewOptimistic(payload: SubmitDeliveryReviewPayload) {
      /** Optimistically submit or update a delivery review for an order, with rollback. */
      const orderKey = `del:order:${payload.orderId}`;
      const prevOrderReview = this.deliveryByOrder[payload.orderId];
      const personListPrev = this.deliveryRecentByPerson[payload.deliveryPersonId] || [];
      const personSummaryPrev = this.deliverySummariesByPerson[payload.deliveryPersonId];

      // optimistic additions
      const nowIso = new Date().toISOString();
      const temp: DeliveryReview = {
        id: prevOrderReview?.id || 'temp_' + Math.random().toString(36).slice(2),
        deliveryPersonId: payload.deliveryPersonId,
        orderId: payload.orderId,
        author: payload.author,
        rating: payload.rating,
        comment: payload.comment,
        createdAt: prevOrderReview?.createdAt || nowIso,
        updatedAt: nowIso,
      };
      this.deliveryByOrder[payload.orderId] = temp;

      // add to person's recent if not present at top
      if (!personListPrev.find((r) => r.orderId === payload.orderId)) {
        this.deliveryRecentByPerson[payload.deliveryPersonId] = [temp, ...personListPrev];
        if (personSummaryPrev) {
          const count = personSummaryPrev.count + 1;
          const total = personSummaryPrev.average * personSummaryPrev.count + payload.rating;
          const avg = Math.round((total / count) * 10) / 10;
          const bucket = Math.max(1, Math.min(5, Math.round(payload.rating))) as 1 | 2 | 3 | 4 | 5;
          this.deliverySummariesByPerson[payload.deliveryPersonId] = {
            average: avg,
            count,
            breakdown: {
              ...personSummaryPrev.breakdown,
              [bucket]: personSummaryPrev.breakdown[bucket] + 1,
            },
          };
        }
      } else {
        // if exists, update item in list
        this.deliveryRecentByPerson[payload.deliveryPersonId] = personListPrev.map((r) =>
          r.orderId === payload.orderId ? temp : r,
        );
      }

      this.setLoading(orderKey, true);
      try {
        const created = await submitDeliveryReview(payload);
        // replace temp with actual
        this.deliveryByOrder[payload.orderId] = created;
        this.deliveryRecentByPerson[payload.deliveryPersonId] = (
          this.deliveryRecentByPerson[payload.deliveryPersonId] || []
        ).map((r) => (r.orderId === payload.orderId ? created : r));
        this.setError(orderKey, undefined);
      } catch (e) {
        // rollback
        this.deliveryByOrder[payload.orderId] = prevOrderReview;
        this.deliveryRecentByPerson[payload.deliveryPersonId] = personListPrev;
        this.deliverySummariesByPerson[payload.deliveryPersonId] = personSummaryPrev;
        const msg = e instanceof Error ? e.message : 'Failed to submit delivery review';
        this.setError(orderKey, msg);
      } finally {
        this.setLoading(orderKey, false);
      }
    },
  },
});
