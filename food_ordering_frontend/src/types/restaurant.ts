export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

/**
 * Backward-compatible working hours and profile-related types used elsewhere in the app.
 */
export interface WorkingHoursDay {
  // e.g., "monday", "tuesday"
  day: string;
  // 24h format "09:00"
  open?: string | null;
  // 24h format "18:00"
  close?: string | null;
  // explicit closed flag to override times
  isClosed?: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // optional geocoordinates if available
  latitude?: number;
  longitude?: number;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  description?: string;
  cuisineTypes?: string[];
  phone?: string;
  email?: string;
  website?: string;
  address: Address;
  workingHours?: WorkingHoursDay[]; // 7 entries preferred
}

export type RestaurantProfileMap = Record<string, RestaurantProfile>;

/**
 * PUBLIC_INTERFACE
 * Public customer-facing Item model extended with inventory info.
 */
export interface Item {
  /** Unique item id */
  id: string
  /** Display name */
  name: string
  /** Rich description */
  description?: string
  /** Unit price */
  price: number
  /** Primary image URL */
  image: string
  /** Category identifier or name */
  category: string
  /** Aggregate rating if available */
  rating?: number
  /**
   * Availability status.
   * When autoStock is enabled, this field is derived from stockQuantity and lowStockThreshold.
   */
  availability?: AvailabilityStatus
  /** Optional nutrition details */
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
    allergens?: string[]
    tags?: string[]
  }

  /**
   * Current stock on hand. When 0, item is out_of_stock.
   */
  stockQuantity?: number

  /**
   * Threshold at or below which the item is flagged as low_stock.
   * Default used by mocks is 5 if not provided.
   */
  lowStockThreshold?: number

  /**
   * When true, availability is auto-derived from stock fields.
   * Admin may disable to override availability manually.
   */
  autoStock?: boolean
}

/**
 * ADMIN payload for creating/updating menu items.
 */
export interface AdminMenuItemEdit {
  name: string
  description: string
  price: number
  image: string
  category: string
  availability: AvailabilityStatus
}

// PUBLIC_INTERFACE
export type MenuItem = Item
