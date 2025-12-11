import { getApiBase } from './api';
import type {
  DeliveryReview,
  RatingSummary,
  RestaurantReview,
  ReviewListResponse,
  SubmitDeliveryReviewPayload,
  SubmitRestaurantReviewPayload,
} from '@/types/reviews';

// Keys for localStorage
const LS_KEYS = {
  restaurantReviews: 'app.restaurantReviews', // Map<restaurantId, RestaurantReview[]>
  deliveryReviewsByPerson: 'app.deliveryReviewsByPerson', // Map<deliveryPersonId, DeliveryReview[]>
  deliveryReviewsByOrder: 'app.deliveryReviewsByOrder', // Map<orderId, DeliveryReview>
};

// SSR-safe localStorage helpers
function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota or storage access issues
  }
}

function computeSummary<T extends { rating: number }>(reviews: T[]): RatingSummary {
  const count = reviews.length;
  if (count === 0) {
    return {
      average: 0,
      count: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as RatingSummary['breakdown'];
  let total = 0;
  for (const r of reviews) {
    total += r.rating;
    const bucket = Math.max(1, Math.min(5, Math.round(r.rating)));
    breakdown[bucket as 1 | 2 | 3 | 4 | 5] += 1;
  }
  return {
    average: Math.round((total / count) * 10) / 10,
    count,
    breakdown,
  };
}

// Attempt network call; fallback to local mock
async function tryFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
  const apiBase = getApiBase();
  if (!apiBase) return null;
  try {
    const res = await fetch(typeof input === 'string' ? `${apiBase}${input}` : input, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Mock persistence helpers
type RestaurantReviewsMap = Record<string, RestaurantReview[]>;
type DeliveryReviewsByPersonMap = Record<string, DeliveryReview[]>;
type DeliveryReviewsByOrderMap = Record<string, DeliveryReview>;

function readRestaurantMap(): RestaurantReviewsMap {
  const raw = safeGetItem(LS_KEYS.restaurantReviews);
  return raw ? (JSON.parse(raw) as RestaurantReviewsMap) : {};
}
function writeRestaurantMap(data: RestaurantReviewsMap) {
  safeSetItem(LS_KEYS.restaurantReviews, JSON.stringify(data));
}
function readDeliveryByPersonMap(): DeliveryReviewsByPersonMap {
  const raw = safeGetItem(LS_KEYS.deliveryReviewsByPerson);
  return raw ? (JSON.parse(raw) as DeliveryReviewsByPersonMap) : {};
}
function writeDeliveryByPersonMap(data: DeliveryReviewsByPersonMap) {
  safeSetItem(LS_KEYS.deliveryReviewsByPerson, JSON.stringify(data));
}
function readDeliveryByOrderMap(): DeliveryReviewsByOrderMap {
  const raw = safeGetItem(LS_KEYS.deliveryReviewsByOrder);
  return raw ? (JSON.parse(raw) as DeliveryReviewsByOrderMap) : {};
}
function writeDeliveryByOrderMap(data: DeliveryReviewsByOrderMap) {
  safeSetItem(LS_KEYS.deliveryReviewsByOrder, JSON.stringify(data));
}

// PUBLIC_INTERFACE
export async function fetchRestaurantReviews(
  restaurantId: string,
  limit = 10,
): Promise<ReviewListResponse<RestaurantReview>> {
  /** Fetch restaurant reviews with summary. Falls back to localStorage mock. */
  const net = await tryFetch<ReviewListResponse<RestaurantReview>>(
    `/ratings/restaurant/${encodeURIComponent(restaurantId)}?limit=${limit}`,
  );
  if (net) return net;

  const map = readRestaurantMap();
  const list = (map[restaurantId] || []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const reviews = list.slice(0, limit);
  return { summary: computeSummary(list), reviews };
}

// PUBLIC_INTERFACE
export async function submitRestaurantReview(
  payload: SubmitRestaurantReviewPayload,
): Promise<RestaurantReview> {
  /** Submit restaurant review; updates local mock storage. */
  const net = await tryFetch<RestaurantReview>(`/ratings/restaurant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (net) return net;

  const now = new Date().toISOString();
  const review: RestaurantReview = {
    id: cryptoRandomId(),
    restaurantId: payload.restaurantId,
    author: payload.author,
    rating: payload.rating,
    comment: payload.comment,
    orderId: payload.orderId,
    createdAt: now,
    updatedAt: now,
  };

  const map = readRestaurantMap();
  map[payload.restaurantId] = [review, ...(map[payload.restaurantId] || [])];
  writeRestaurantMap(map);
  return review;
}

// PUBLIC_INTERFACE
export async function fetchDeliveryReviews(
  params: { deliveryPersonId: string } | { orderId: string },
  limit = 10,
): Promise<ReviewListResponse<DeliveryReview>> {
  /** Fetch delivery reviews by person or order. Mock fallback included. */
  const qs =
    'deliveryPersonId' in params
      ? `deliveryPersonId=${encodeURIComponent(params.deliveryPersonId)}`
      : `orderId=${encodeURIComponent(params.orderId)}`;

  const net = await tryFetch<ReviewListResponse<DeliveryReview>>(
    `/ratings/delivery?${qs}&limit=${limit}`,
  );
  if (net) return net;

  // Mock fallback
  if ('deliveryPersonId' in params) {
    const personMap = readDeliveryByPersonMap();
    const list = (personMap[params.deliveryPersonId] || []).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return { summary: computeSummary(list), reviews: list.slice(0, limit) };
  } else {
    const orderMap = readDeliveryByOrderMap();
    const review = orderMap[params.orderId];
    const list = review ? [review] : [];
    return { summary: computeSummary(list), reviews: list };
  }
}

// PUBLIC_INTERFACE
export async function submitDeliveryReview(
  payload: SubmitDeliveryReviewPayload,
): Promise<DeliveryReview> {
  /** Submit delivery review; updates local mock storage including byOrder and byPerson. */
  const net = await tryFetch<DeliveryReview>(`/ratings/delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (net) return net;

  const now = new Date().toISOString();
  const review: DeliveryReview = {
    id: cryptoRandomId(),
    deliveryPersonId: payload.deliveryPersonId,
    orderId: payload.orderId,
    author: payload.author,
    rating: payload.rating,
    comment: payload.comment,
    createdAt: now,
    updatedAt: now,
  };

  const byPerson = readDeliveryByPersonMap();
  byPerson[payload.deliveryPersonId] = [review, ...(byPerson[payload.deliveryPersonId] || [])];
  writeDeliveryByPersonMap(byPerson);

  const byOrder = readDeliveryByOrderMap();
  byOrder[payload.orderId] = review; // single review per order for delivery
  writeDeliveryByOrderMap(byOrder);

  return review;
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // randomUUID exists in modern runtimes; fallback provided below for older envs
    const anyCrypto = crypto as unknown as { randomUUID?: () => string };
    if (anyCrypto.randomUUID) return anyCrypto.randomUUID();
  }
  return 'rvw_' + Math.random().toString(36).slice(2, 10);
}
