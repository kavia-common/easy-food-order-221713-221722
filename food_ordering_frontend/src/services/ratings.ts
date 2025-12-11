import { runtimeConfig } from './runtimeConfig';
import { nanoid } from 'nanoid';
import type {
  DeliveryRating,
  PagedResult,
  PaginationParams,
  RatingSummary,
  RestaurantRating,
  Review,
  SubmitDeliveryReviewInput,
  SubmitRestaurantReviewInput,
} from '@/types/ratings';

// localStorage key for persistence
const LS_REVIEWS_KEY = 'app.ratings.reviews.v1';

// In-memory cache to avoid repeated parsing
let cacheLoaded = false;
let reviewCache: Review[] = [];

// PUBLIC_INTERFACE
export function listRestaurantReviews(
  restaurantId: string,
  params: PaginationParams = { page: 1, pageSize: 10 }
): PagedResult<RestaurantRating> {
  ensureLoaded();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

  const all = reviewCache.filter(
    (r) => r.subjectType === 'restaurant' && r.subjectId === restaurantId
  ) as RestaurantRating[];

  // Sort by createdAt desc
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = all.slice(start, start + pageSize);

  return { data, page, pageSize, total, totalPages };
}

// PUBLIC_INTERFACE
export function listDeliveryReviews(
  deliveryPersonId: string,
  params: PaginationParams = { page: 1, pageSize: 10 }
): PagedResult<DeliveryRating> {
  ensureLoaded();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

  const all = reviewCache.filter(
    (r) => r.subjectType === 'delivery' && r.subjectId === deliveryPersonId
  ) as DeliveryRating[];

  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = all.slice(start, start + pageSize);

  return { data, page, pageSize, total, totalPages };
}

// PUBLIC_INTERFACE
export function getRestaurantRatingSummary(restaurantId: string): RatingSummary {
  ensureLoaded();
  const ratings = reviewCache.filter(
    (r) => r.subjectType === 'restaurant' && r.subjectId === restaurantId
  );
  return computeSummary(ratings);
}

// PUBLIC_INTERFACE
export function getDeliveryRatingSummary(deliveryPersonId: string): RatingSummary {
  ensureLoaded();
  const ratings = reviewCache.filter(
    (r) => r.subjectType === 'delivery' && r.subjectId === deliveryPersonId
  );
  return computeSummary(ratings);
}

// PUBLIC_INTERFACE
export async function submitRestaurantReview(
  input: SubmitRestaurantReviewInput
): Promise<{ ok: boolean; error?: string; review?: RestaurantRating; summary?: RatingSummary }> {
  ensureLoaded();
  const validation = validateInput(input.stars, input.comment);
  if (validation) return { ok: false, error: validation };

  // one review per order per subject
  if (input.orderId) {
    const exists = reviewCache.find(
      (r) =>
        r.subjectType === 'restaurant' &&
        r.subjectId === input.restaurantId &&
        r.orderId === input.orderId
    );
    if (exists) return { ok: false, error: 'You have already reviewed this order.' };
  }

  const now = new Date().toISOString();
  const newReview: RestaurantRating = {
    id: nanoid(),
    subjectType: 'restaurant',
    subjectId: input.restaurantId,
    orderId: input.orderId,
    userName: input.userName || 'Guest',
    stars: clampStars(input.stars),
    comment: input.comment.trim(),
    createdAt: now,
  };

  // Optimistic update
  reviewCache.unshift(newReview);
  persist();

  // TODO: When backend is available, POST to `${VITE_API_BASE}/ratings/restaurant`
  void runtimeConfig;

  const summary = getRestaurantRatingSummary(input.restaurantId);
  return { ok: true, review: newReview, summary };
}

// PUBLIC_INTERFACE
export async function submitDeliveryReview(
  input: SubmitDeliveryReviewInput
): Promise<{ ok: boolean; error?: string; review?: DeliveryRating; summary?: RatingSummary }> {
  ensureLoaded();
  const validation = validateInput(input.stars, input.comment);
  if (validation) return { ok: false, error: validation };

  // one review per order per subject
  if (input.orderId) {
    const exists = reviewCache.find(
      (r) =>
        r.subjectType === 'delivery' &&
        r.subjectId === input.deliveryPersonId &&
        r.orderId === input.orderId
    );
    if (exists) return { ok: false, error: 'You have already reviewed this order.' };
  }

  const now = new Date().toISOString();
  const newReview: DeliveryRating = {
    id: nanoid(),
    subjectType: 'delivery',
    subjectId: input.deliveryPersonId,
    orderId: input.orderId,
    userName: input.userName || 'Guest',
    stars: clampStars(input.stars),
    comment: input.comment.trim(),
    createdAt: now,
  };

  // Optimistic update
  reviewCache.unshift(newReview);
  persist();

  // TODO: When backend is available, POST to `${VITE_API_BASE}/ratings/delivery`
  void runtimeConfig;

  const summary = getDeliveryRatingSummary(input.deliveryPersonId);
  return { ok: true, review: newReview, summary };
}

// Helpers

function ensureLoaded() {
  if (cacheLoaded) return;
  try {
    const raw = localStorage.getItem(LS_REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Review[];
      if (Array.isArray(parsed)) {
        reviewCache = parsed.filter(isValidReviewShape);
      }
    }
  } catch {
    // ignore parse errors
  } finally {
    cacheLoaded = true;
  }
}

function persist() {
  try {
    localStorage.setItem(LS_REVIEWS_KEY, JSON.stringify(reviewCache));
  } catch {
    // ignore quota issues
  }
}

function isValidReviewShape(obj: any): obj is Review {
  return (
    obj &&
    (obj.subjectType === 'restaurant' || obj.subjectType === 'delivery') &&
    typeof obj.subjectId === 'string' &&
    typeof obj.id === 'string' &&
    typeof obj.stars === 'number' &&
    typeof obj.comment === 'string' &&
    typeof obj.createdAt === 'string'
  );
}

function computeSummary(list: Review[]): RatingSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary['distribution'];
  if (list.length === 0) {
    return { average: 0, count: 0, distribution };
  }
  let sum = 0;
  for (const r of list) {
    const s = clampStars(r.stars);
    sum += s;
    distribution[s] += 1;
  }
  const average = Math.round((sum / list.length) * 10) / 10;
  return { average, count: list.length, distribution };
}

function validateInput(stars: number, comment: string): string | null {
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return 'Please select a star rating between 1 and 5.';
  }
  const trimmed = (comment ?? '').trim();
  if (trimmed.length < 5) {
    return 'Comment is too short (min 5 characters).';
  }
  if (trimmed.length > 1000) {
    return 'Comment is too long (max 1000 characters).';
  }
  return null;
}

function clampStars(n: number): 1 | 2 | 3 | 4 | 5 {
  const v = Math.max(1, Math.min(5, Math.round(n)));
  return (v as unknown) as 1 | 2 | 3 | 4 | 5;
}
