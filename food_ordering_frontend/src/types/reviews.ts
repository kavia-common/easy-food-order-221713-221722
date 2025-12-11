export type RatingValue = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

export interface RatingBreakdown {
  // percentage of total or counts, interpret via count
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: RatingBreakdown;
}

export interface ReviewBase {
  id: string;
  author: string;
  rating: RatingValue;
  comment: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

export interface RestaurantReview extends ReviewBase {
  restaurantId: string;
  orderId?: string;
}

export interface DeliveryReview extends ReviewBase {
  deliveryPersonId: string;
  orderId: string;
}

export interface ReviewListResponse<T extends ReviewBase> {
  summary: RatingSummary;
  reviews: T[];
}

export interface SubmitRestaurantReviewPayload {
  restaurantId: string;
  author: string;
  rating: RatingValue;
  comment: string;
  orderId?: string;
}

export interface SubmitDeliveryReviewPayload {
  deliveryPersonId: string;
  orderId: string;
  author: string;
  rating: RatingValue;
  comment: string;
}
